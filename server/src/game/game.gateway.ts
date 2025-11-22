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

@WebSocketGateway({
  cors: {
    origin: '*', // Allow all origins for now
  },
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly gameService: GameService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    const result = this.gameService.disconnectPlayer(client.id);
    if (result) {
      const { roomId, playerId } = result;
      const room = this.gameService.getRoom(roomId);
      if (room) {
        // Emit room update so everyone sees updated connection status
        this.server.to(roomId).emit('roomUpdate', room);
      }
    }
  }

  @SubscribeMessage('createRoom')
  createRoom(
    @MessageBody() data: { playerName: string, language: 'en' | 'id', playerId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { room, player } = this.gameService.createRoom(data.playerName, client.id, data.language, data.playerId);
    client.join(room.id);
    return { room, player };
  }

  @SubscribeMessage('joinRoom')
  joinRoom(
    @MessageBody() data: { roomId: string; playerName: string, playerId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { room, player } = this.gameService.joinRoom(data.roomId, data.playerName, client.id, data.playerId);
      client.join(room.id);
      // Emit room update to all players
      this.server.to(room.id).emit('roomUpdate', room);
      return { room, player };
    } catch (error) {
      return { error: error.message };
    }
  }

  @SubscribeMessage('reconnect')
  reconnect(
    @MessageBody() data: { playerId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      // Removed roomId dependency, searching globally
      const { room, player } = this.gameService.reconnectPlayer(data.playerId, client.id);
      client.join(room.id);
      client.emit('reconnected', { room, player });
      // Emit room update to all players
      this.server.to(room.id).emit('roomUpdate', room);
    } catch (error) {
      return { error: error.message };
    }
  }
  
  @SubscribeMessage('kickPlayer')
  kickPlayer(
      @MessageBody() data: { roomId: string; playerId: string; targetId: string },
  ) {
      try {
          const { room, kickedPlayerId } = this.gameService.kickPlayer(data.roomId, data.playerId, data.targetId);
          if (room) {
              this.server.to(room.id).emit('roomUpdate', room);
              this.server.to(room.id).emit('playerKicked', { playerId: kickedPlayerId });
          }
      } catch (error) {
          return { error: error.message };
      }
  }

  @SubscribeMessage('startGame')
  startGame(
    @MessageBody() data: { roomId: string; playerId: string },
  ) {
    try {
      console.log(`Starting game for room ${data.roomId} requested by ${data.playerId}`);
      const room = this.gameService.startGame(data.roomId, data.playerId);
      this.server.to(room.id).emit('gameStarted', room);
      console.log(`Emitted gameStarted to room ${room.id}`);
    } catch (error) {
      console.error(`Error starting game: ${error.message}`);
      return { error: error.message };
    }
  }

  @SubscribeMessage('submitAnswer')
  submitAnswer(
    @MessageBody() data: { roomId: string; playerId: string; answer: string },
  ) {
    try {
      const { room, allAnswered } = this.gameService.submitAnswer(data.roomId, data.playerId, data.answer);
      
      // Emit room update so everyone sees the answer was submitted
      this.server.to(room.id).emit('roomUpdate', room);
      console.log(`Answer submitted by ${data.playerId}, room updated`);

      if (allAnswered) {
        // Calculate results
        const result = this.gameService.calculateRoundResults(room.id);
        // Emit with consistent field name 'isMatch' instead of 'match'
        this.server.to(room.id).emit('roundResult', { 
          room: result.room, 
          isMatch: result.match, 
          word: result.word 
        });
        console.log(`Round results emitted for room ${room.id}, match: ${result.match}`);
        
        // No longer auto-advancing. Waiting for 'nextRound' event.
      }
    } catch (error) {
      return { error: error.message };
    }
  }
  
  @SubscribeMessage('nextRound')
  nextRound(@MessageBody() data: { roomId: string; playerId: string }) {
      try {
           // Validate creator
           const room = this.gameService.getRoom(data.roomId);
           if (!room) return;
           const player = room.players.find(p => p.id === data.playerId);
           if (!player || !player.isCreator) {
               return { error: "Only creator can advance round" };
           }

           const next = this.gameService.nextRound(data.roomId);
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
  leaveRoom(
      @MessageBody() data: { roomId: string; playerId: string },
      @ConnectedSocket() client: Socket,
  ) {
      try {
          const { room, destroyed } = this.gameService.leaveRoom(data.roomId, data.playerId);
          client.leave(data.roomId);
          
          if (destroyed) {
              this.server.to(data.roomId).emit('roomDestroyed');
              // Make everyone leave?
              this.server.in(data.roomId).disconnectSockets();
          } else if (room) {
              this.server.to(room.id).emit('roomUpdate', room);
              // Also emit to the one who left? No, they left.
          }
      } catch (error) {
          return { error: error.message };
      }
  }

  @SubscribeMessage('playerReady')
  playerReady(
      @MessageBody() data: { roomId: string; playerId: string },
  ) {
      try {
          let room = this.gameService.playerReady(data.roomId, data.playerId);
          // Check if everyone is ready to switch to LOBBY state
          room = this.gameService.checkAndSwitchToLobby(data.roomId);
          this.server.to(room.id).emit('roomUpdate', room);
      } catch (error) {
          return { error: error.message };
      }
  }
}
