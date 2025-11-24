import { Injectable, Logger } from '@nestjs/common';
import { Room, Player, GameState } from './interfaces/game.interfaces';
import { v4 as uuidv4 } from 'uuid';
import { WORDS_EN, WORDS_ID } from './constants/words';
import { GameConfig } from './config/game.config';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class GameService {
  private rooms: Map<string, Room> = new Map();
  private readonly logger = new Logger(GameService.name);

  constructor(private redisService: RedisService) {
    setInterval(() => this.cleanupInactiveRooms(), GameConfig.CLEANUP_INTERVAL);
  }

  async createRoom(
    creatorName: string,
    creatorSocketId: string,
    language: 'en' | 'id' = 'en',
    playerId?: string,
  ): Promise<{ room: Room; player: Player }> {
    const roomId = this.generateRoomId();
    const finalPlayerId = playerId || uuidv4();

    const creator: Player = {
      id: finalPlayerId,
      socketId: creatorSocketId,
      name: creatorName,
      isCreator: true,
      score: 0,
      isConnected: true,
      isReady: true,
    };

    const room: Room = {
      id: roomId,
      state: GameState.LOBBY,
      language: language,
      players: [creator],
      spectators: [],
      words: [],
      currentWordIndex: 0,
      currentAnswers: {},
      lastActivity: Date.now(),
    };

    await this.saveRoom(room);
    return { room, player: creator };
  }

  async joinRoom(
    roomId: string,
    playerName: string,
    socketId: string,
    playerId?: string,
  ): Promise<{ room: Room; player: Player }> {
    const room = await this.getRoom(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    await this.updateActivity(roomId);

    if (room.players.length >= GameConfig.MAX_PLAYERS) {
      throw new Error('Room is full');
    }

    const finalPlayerId = playerId || uuidv4();

    const existingPlayer =
      room.players.find((p) => p.id === finalPlayerId) ||
      room.spectators.find((p) => p.id === finalPlayerId);

    if (existingPlayer) {
      existingPlayer.socketId = socketId;
      existingPlayer.name = playerName;
      existingPlayer.isConnected = true;
      await this.saveRoom(room);
      return { room, player: existingPlayer };
    }

    const player: Player = {
      id: finalPlayerId,
      socketId,
      name: playerName,
      isCreator: false,
      score: 0,
      isConnected: true,
      isReady: true,
    };

    if (room.state === GameState.PLAYING) {
      room.spectators.push(player);
    } else {
      room.players.push(player);
    }

    await this.saveRoom(room);
    return { room, player };
  }

  async reconnectPlayer(
    playerId: string,
    socketId: string,
  ): Promise<{ room: Room; player: Player }> {
    const roomId = await this.redisService.getRoomByPlayerId(playerId);

    if (roomId) {
      const room = await this.getRoom(roomId);
      if (room) {
        let player = room.players.find((p) => p.id === playerId);
        if (!player) {
          player = room.spectators.find((p) => p.id === playerId);
        }

        if (player) {
          player.socketId = socketId;
          player.isConnected = true;
          await this.updateActivity(roomId);
          await this.saveRoom(room);
          return { room, player };
        }
      }
    }

    // Fallback to in-memory search
    for (const [roomId, room] of this.rooms.entries()) {
      let player = room.players.find((p) => p.id === playerId);
      if (!player) {
        player = room.spectators.find((p) => p.id === playerId);
      }

      if (player) {
        player.socketId = socketId;
        player.isConnected = true;
        await this.updateActivity(roomId);
        await this.saveRoom(room);
        return { room, player };
      }
    }

    throw new Error('Player not found in any room');
  }

  async disconnectPlayer(
    socketId: string,
  ): Promise<{ roomId: string; playerId: string } | null> {
    const allRooms = await this.getAllRooms();

    for (const room of allRooms) {
      const player = room.players.find((p) => p.socketId === socketId);
      if (player) {
        player.isConnected = false;
        await this.updateActivity(room.id);
        await this.saveRoom(room);
        return { roomId: room.id, playerId: player.id };
      }

      const spectator = room.spectators.find((p) => p.socketId === socketId);
      if (spectator) {
        spectator.isConnected = false;
        await this.updateActivity(room.id);
        await this.saveRoom(room);
        return { roomId: room.id, playerId: spectator.id };
      }
    }

    return null;
  }

  async kickPlayer(
    roomId: string,
    requesterId: string,
    targetPlayerId: string,
  ): Promise<{ room: Room | null; kickedPlayerId: string }> {
    const room = await this.getRoom(roomId);
    if (!room) throw new Error('Room not found');

    const requester = room.players.find((p) => p.id === requesterId);
    if (!requester || !requester.isCreator) {
      throw new Error('Only creator can kick players');
    }

    room.players = room.players.filter((p) => p.id !== targetPlayerId);
    room.spectators = room.spectators.filter((p) => p.id !== targetPlayerId);

    await this.updateActivity(roomId);
    await this.saveRoom(room);
    return { room, kickedPlayerId: targetPlayerId };
  }

  async leaveRoom(
    roomId: string,
    playerId: string,
  ): Promise<{ room?: Room; destroyed: boolean }> {
    const room = await this.getRoom(roomId);
    if (!room) throw new Error('Room not found');

    const playerIndex = room.players.findIndex((p) => p.id === playerId);
    const player = room.players[playerIndex];

    if (player) {
      if (player.isCreator) {
        await this.deleteRoom(roomId);
        return { destroyed: true };
      } else {
        room.players.splice(playerIndex, 1);
        await this.updateActivity(roomId);
        await this.saveRoom(room);
        return { room, destroyed: false };
      }
    }

    const spectatorIndex = room.spectators.findIndex((s) => s.id === playerId);
    if (spectatorIndex !== -1) {
      room.spectators.splice(spectatorIndex, 1);
      await this.updateActivity(roomId);
      await this.saveRoom(room);
      return { room, destroyed: false };
    }

    throw new Error('Player not found in room');
  }

  async playerReady(roomId: string, playerId: string): Promise<Room> {
    const room = await this.getRoom(roomId);
    if (!room) throw new Error('Room not found');

    const player = room.players.find((p) => p.id === playerId);
    if (player) {
      player.isReady = true;
    }

    await this.updateActivity(roomId);
    await this.saveRoom(room);
    return room;
  }

  async startGame(roomId: string, requesterId: string): Promise<Room> {
    const room = await this.getRoom(roomId);
    if (!room) throw new Error('Room not found');

    const requester = room.players.find((p) => p.id === requesterId);
    if (!requester || !requester.isCreator) {
      throw new Error('Only creator can start game');
    }

    if (room.players.length < GameConfig.MIN_PLAYERS) {
      throw new Error(
        `Need at least ${GameConfig.MIN_PLAYERS} players to start`,
      );
    }

    const unreadyPlayers = room.players.filter((p) => !p.isReady);
    if (unreadyPlayers.length > 0) {
      throw new Error('Wait for all players to return to lobby');
    }

    room.state = GameState.PLAYING;
    room.words = this.generateWords(room.language);
    room.currentWordIndex = 0;
    room.currentAnswers = {};

    room.players.forEach((p) => {
      p.score = 0;
      p.isReady = false;
    });

    await this.updateActivity(roomId);
    await this.saveRoom(room);
    return room;
  }

  async submitAnswer(
    roomId: string,
    playerId: string,
    answer: string,
  ): Promise<{ room: Room; allAnswered: boolean }> {
    const room = await this.getRoom(roomId);
    if (!room) throw new Error('Room not found');
    if (room.state !== GameState.PLAYING)
      throw new Error('Game not in progress');

    const player = room.players.find((p) => p.id === playerId);
    if (!player) throw new Error('Player not found');

    room.currentAnswers[playerId] = answer;
    await this.updateActivity(roomId);
    await this.saveRoom(room);

    const connectedPlayers = room.players.filter((p) => p.isConnected);
    const allAnswered = connectedPlayers.every(
      (p) => room.currentAnswers[p.id] !== undefined,
    );

    return { room, allAnswered };
  }

  async calculateRoundResults(roomId: string): Promise<{
    room: Room;
    match: boolean;
    word: string;
  }> {
    const room = await this.getRoom(roomId);
    if (!room) throw new Error('Room not found');

    const answers = Object.values(room.currentAnswers);
    const normalizedAnswers = answers.map((a) => a.trim().toLowerCase());
    const uniqueAnswers = new Set(normalizedAnswers);

    const match = uniqueAnswers.size === 1 && normalizedAnswers.length > 0;
    const currentWord = room.words[room.currentWordIndex];

    if (match) {
      room.players.forEach((p) => {
        if (room.currentAnswers[p.id]) {
          p.score += 1;
        }
      });
      await this.saveRoom(room);
    }

    return { room, match, word: currentWord };
  }

  async nextRound(roomId: string): Promise<{ room: Room; gameOver: boolean }> {
    const room = await this.getRoom(roomId);
    if (!room) throw new Error('Room not found');

    room.currentWordIndex++;
    room.currentAnswers = {};
    await this.updateActivity(roomId);

    if (room.currentWordIndex >= room.words.length) {
      room.state = GameState.ENDED;
      room.players.forEach((p) => (p.isReady = false));
      await this.saveRoom(room);
      return { room, gameOver: true };
    }

    await this.saveRoom(room);
    return { room, gameOver: false };
  }

  async checkAndSwitchToLobby(roomId: string): Promise<Room> {
    const room = await this.getRoom(roomId);
    if (!room) throw new Error('Room not found');

    const allReady = room.players.every((p) => p.isReady);
    if (allReady && room.state === GameState.ENDED) {
      room.state = GameState.LOBBY;
      room.words = [];
      room.currentWordIndex = 0;
      room.currentAnswers = {};

      room.players = [...room.players, ...room.spectators];
      room.spectators = [];
      room.players.forEach((p) => (p.isReady = true));

      await this.saveRoom(room);
    }

    return room;
  }

  async getRoomPublic(roomId: string): Promise<Room | null> {
    return this.getRoom(roomId);
  }

  private async getRoom(roomId: string): Promise<Room | null> {
    if (this.redisService.isConnected()) {
      const room = await this.redisService.getRoom(roomId);
      if (room) {
        this.rooms.set(roomId, room);
        return room;
      }
    }

    return this.rooms.get(roomId) || null;
  }

  private async saveRoom(room: Room): Promise<void> {
    this.rooms.set(room.id, room);

    if (this.redisService.isConnected()) {
      await this.redisService.setRoom(room.id, room);
    }
  }

  private async deleteRoom(roomId: string): Promise<void> {
    this.rooms.delete(roomId);

    if (this.redisService.isConnected()) {
      await this.redisService.deleteRoom(roomId);
    }
  }

  private async getAllRooms(): Promise<Room[]> {
    if (this.redisService.isConnected()) {
      return await this.redisService.getAllRooms();
    }

    return Array.from(this.rooms.values());
  }

  private generateRoomId(): string {
    return Math.random().toString(36).substring(2, 6).toUpperCase();
  }

  private generateWords(language: 'en' | 'id'): string[] {
    const pool = language === 'id' ? WORDS_ID : WORDS_EN;
    return pool
      .sort(() => 0.5 - Math.random())
      .slice(0, GameConfig.WORDS_PER_GAME);
  }

  private async updateActivity(roomId: string): Promise<void> {
    const room = await this.getRoom(roomId);
    if (room) {
      room.lastActivity = Date.now();
      await this.saveRoom(room);
    }
  }

  private async cleanupInactiveRooms(): Promise<void> {
    const now = Date.now();

    if (this.redisService.isConnected()) {
      await this.redisService.cleanupInactiveRooms(
        GameConfig.ROOM_INACTIVITY_TIMEOUT,
      );
    }

    for (const [roomId, room] of this.rooms.entries()) {
      if (now - room.lastActivity > GameConfig.ROOM_INACTIVITY_TIMEOUT) {
        await this.deleteRoom(roomId);
        this.logger.log(`Room ${roomId} removed due to inactivity`);
      }
    }
  }
}
