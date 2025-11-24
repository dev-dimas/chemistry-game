import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { Logger, UseFilters, UsePipes, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  WsExceptionFilter,
  AllExceptionsFilter,
} from '../filters/ws-exception.filter';
import {
  CreateRoomDto,
  JoinRoomDto,
  ReconnectDto,
  StartGameDto,
  SubmitAnswerDto,
  KickPlayerDto,
  RoomActionDto,
} from './dto';

@WebSocketGateway({
  cors: {
    origin: (origin, callback) => {
      const configService = new ConfigService();
      const allowedOrigin =
        configService.get<string>('CLIENT_URL') || 'http://localhost:5173';
      callback(null, allowedOrigin);
    },
    credentials: true,
  },
})
@UseFilters(new AllExceptionsFilter(), new WsExceptionFilter())
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(GameGateway.name);

  constructor(
    private readonly gameService: GameService,
    private readonly configService: ConfigService,
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    const result = await this.gameService.disconnectPlayer(client.id);
    if (result) {
      const { roomId } = result;
      const room = await this.gameService.getRoomPublic(roomId);
      if (room) {
        this.server.to(roomId).emit('roomUpdate', room);
      }
    }
  }

  @SubscribeMessage('createRoom')
  async createRoom(
    @MessageBody() data: CreateRoomDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { room, player } = await this.gameService.createRoom(
        data.playerName,
        client.id,
        data.language,
        data.playerId,
      );
      client.join(room.id);
      return { room, player };
    } catch (error) {
      return { error: error.message };
    }
  }

  @SubscribeMessage('joinRoom')
  async joinRoom(
    @MessageBody() data: JoinRoomDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { room, player } = await this.gameService.joinRoom(
        data.roomId,
        data.playerName,
        client.id,
        data.playerId,
      );
      client.join(room.id);
      this.server.to(room.id).emit('roomUpdate', room);
      return { room, player };
    } catch (error) {
      return { error: error.message };
    }
  }

  @SubscribeMessage('reconnect')
  async reconnect(
    @MessageBody() data: ReconnectDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { room, player } = await this.gameService.reconnectPlayer(
        data.playerId,
        client.id,
      );
      client.join(room.id);
      client.emit('reconnected', { room, player });
      this.server.to(room.id).emit('roomUpdate', room);
    } catch (error) {
      return { error: error.message };
    }
  }

  @SubscribeMessage('kickPlayer')
  async kickPlayer(@MessageBody() data: KickPlayerDto) {
    try {
      const { room, kickedPlayerId } = await this.gameService.kickPlayer(
        data.roomId,
        data.playerId,
        data.targetId,
      );
      if (room) {
        this.server.to(room.id).emit('roomUpdate', room);
        this.server
          .to(room.id)
          .emit('playerKicked', { playerId: kickedPlayerId });
      }
    } catch (error) {
      return { error: error.message };
    }
  }

  @SubscribeMessage('startGame')
  async startGame(@MessageBody() data: StartGameDto) {
    try {
      this.logger.log(
        `Starting game for room ${data.roomId} requested by ${data.playerId}`,
      );
      const room = await this.gameService.startGame(data.roomId, data.playerId);
      this.server.to(room.id).emit('gameStarted', room);
      this.logger.log(`Emitted gameStarted to room ${room.id}`);
    } catch (error) {
      this.logger.error(`Error starting game: ${error.message}`);
      return { error: error.message };
    }
  }

  @SubscribeMessage('submitAnswer')
  async submitAnswer(@MessageBody() data: SubmitAnswerDto) {
    try {
      const { room, allAnswered } = await this.gameService.submitAnswer(
        data.roomId,
        data.playerId,
        data.answer,
      );

      this.server.to(room.id).emit('roomUpdate', room);
      this.logger.log(`Answer submitted by ${data.playerId}, room updated`);

      if (allAnswered) {
        const result = await this.gameService.calculateRoundResults(room.id);
        this.server.to(room.id).emit('roundResult', {
          room: result.room,
          isMatch: result.match,
          word: result.word,
        });
        this.logger.log(
          `Round results emitted for room ${room.id}, match: ${result.match}`,
        );
      }
    } catch (error) {
      return { error: error.message };
    }
  }

  @SubscribeMessage('nextRound')
  async nextRound(@MessageBody() data: RoomActionDto) {
    try {
      const room = await this.gameService.getRoomPublic(data.roomId);
      if (!room) return { error: 'Room not found' };

      const player = room.players.find((p) => p.id === data.playerId);
      if (!player || !player.isCreator) {
        return { error: 'Only creator can advance round' };
      }

      const next = await this.gameService.nextRound(data.roomId);
      if (next.gameOver) {
        this.server.to(data.roomId).emit('gameOver', next.room);
      } else {
        this.server.to(data.roomId).emit('nextRound', next.room);
      }
    } catch (error) {
      return { error: error.message };
    }
  }

  @SubscribeMessage('leaveRoom')
  async leaveRoom(
    @MessageBody() data: RoomActionDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { room, destroyed } = await this.gameService.leaveRoom(
        data.roomId,
        data.playerId,
      );
      client.leave(data.roomId);

      if (destroyed) {
        this.server.to(data.roomId).emit('roomDestroyed');
        this.server.in(data.roomId).disconnectSockets();
      } else if (room) {
        this.server.to(room.id).emit('roomUpdate', room);
      }
    } catch (error) {
      return { error: error.message };
    }
  }

  @SubscribeMessage('playerReady')
  async playerReady(@MessageBody() data: RoomActionDto) {
    try {
      let room = await this.gameService.playerReady(data.roomId, data.playerId);
      room = await this.gameService.checkAndSwitchToLobby(data.roomId);
      this.server.to(room.id).emit('roomUpdate', room);
    } catch (error) {
      return { error: error.message };
    }
  }

  @SubscribeMessage('checkRoom')
  async checkRoom(@MessageBody() data: { roomId: string }) {
    try {
      const room = await this.gameService.getRoomPublic(data.roomId);
      return { exists: room !== null };
    } catch (error) {
      return { exists: false };
    }
  }
}
