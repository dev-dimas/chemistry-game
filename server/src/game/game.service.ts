import { Injectable } from '@nestjs/common';
import { Room, Player, GameState } from './interfaces/game.interfaces';
import { v4 as uuidv4 } from 'uuid';
import { WORDS_EN, WORDS_ID } from './constants/words';
import { GameConfig } from './config/game.config';

@Injectable()
export class GameService {
  private rooms: Map<string, Room> = new Map();

  constructor() {
    // Start cleanup interval
    setInterval(() => this.cleanupInactiveRooms(), GameConfig.CLEANUP_INTERVAL);
  }

  createRoom(creatorName: string, creatorSocketId: string, language: 'en' | 'id' = 'en', playerId?: string): { room: Room; player: Player } {
    const roomId = this.generateRoomId();
    // Use provided playerId or generate new one
    const finalPlayerId = playerId || uuidv4();
    
    const creator: Player = {
      id: finalPlayerId,
      socketId: creatorSocketId,
      name: creatorName,
      isCreator: true,
      score: 0,
      isConnected: true,
      isReady: true, // Creator always ready in new room
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

    this.rooms.set(roomId, room);
    return { room, player: creator };
  }

  joinRoom(roomId: string, playerName: string, socketId: string, playerId?: string): { room: Room; player: Player } {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    this.updateActivity(roomId);

    if (room.players.length >= GameConfig.MAX_PLAYERS) {
      throw new Error('Room is full');
    }

    const finalPlayerId = playerId || uuidv4();
    
    // Check if player is already in the room (re-joining)?
    const existingPlayer = room.players.find(p => p.id === finalPlayerId) || room.spectators.find(p => p.id === finalPlayerId);
    if (existingPlayer) {
        // Update socket ID and name
        existingPlayer.socketId = socketId;
        existingPlayer.name = playerName;
        existingPlayer.isConnected = true;
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
      // Emit spectator update? Handled by controller
    } else {
      room.players.push(player);
    }

    return { room, player };
  }

  reconnectPlayer(playerId: string, socketId: string): { room: Room; player: Player } {
    // Search all rooms for the player
    for (const [roomId, room] of this.rooms.entries()) {
      let player = room.players.find((p) => p.id === playerId);
      if (player) {
        player.socketId = socketId;
        player.isConnected = true;
        this.updateActivity(roomId);
        return { room, player };
      }

      player = room.spectators.find((p) => p.id === playerId);
      if (player) {
        player.socketId = socketId;
        player.isConnected = true;
        this.updateActivity(roomId);
        return { room, player };
      }
    }

    throw new Error('Player not found in any room');
  }

  disconnectPlayer(socketId: string): { roomId: string; playerId: string } | null {
    for (const [roomId, room] of this.rooms.entries()) {
      const player = room.players.find((p) => p.socketId === socketId);
      if (player) {
        player.isConnected = false;
        this.updateActivity(roomId);
        // If creator disconnects, maybe reassign creator? For now, just mark disconnected.
        return { roomId, playerId: player.id };
      }
      
      const spectator = room.spectators.find((p) => p.socketId === socketId);
      if (spectator) {
        spectator.isConnected = false;
        this.updateActivity(roomId);
        return { roomId, playerId: spectator.id };
      }
    }
    return null;
  }

  kickPlayer(roomId: string, requesterId: string, targetPlayerId: string): { room: Room | null; kickedPlayerId: string } {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error('Room not found');
    
    const requester = room.players.find(p => p.id === requesterId);
    if (!requester || !requester.isCreator) {
      throw new Error('Only creator can kick players');
    }

    room.players = room.players.filter(p => p.id !== targetPlayerId);
    room.spectators = room.spectators.filter(p => p.id !== targetPlayerId);
    
    this.updateActivity(roomId);
    return { room, kickedPlayerId: targetPlayerId };
  }

  leaveRoom(roomId: string, playerId: string): { room?: Room; destroyed: boolean } {
      const room = this.rooms.get(roomId);
      if (!room) throw new Error('Room not found');

      const playerIndex = room.players.findIndex(p => p.id === playerId);
      const player = room.players[playerIndex];
      
      if (player) {
          if (player.isCreator) {
              // If creator leaves, destroy room
              this.rooms.delete(roomId);
              return { destroyed: true };
          } else {
              // Remove player
              room.players.splice(playerIndex, 1);
              this.updateActivity(roomId);
              return { room, destroyed: false };
          }
      }
      
      const spectatorIndex = room.spectators.findIndex(s => s.id === playerId);
      if (spectatorIndex !== -1) {
          room.spectators.splice(spectatorIndex, 1);
          this.updateActivity(roomId);
          return { room, destroyed: false };
      }
      
      throw new Error('Player not found in room');
  }

  playerReady(roomId: string, playerId: string): Room {
      const room = this.rooms.get(roomId);
      if (!room) throw new Error('Room not found');
      
      const player = room.players.find(p => p.id === playerId);
      if (player) {
          player.isReady = true;
      }
      // Also check spectators? They just watch.
      
      this.updateActivity(roomId);
      return room;
  }

  startGame(roomId: string, requesterId: string): Room {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error('Room not found');

    const requester = room.players.find(p => p.id === requesterId);
    if (!requester || !requester.isCreator) {
      throw new Error('Only creator can start game');
    }

    if (room.players.length < GameConfig.MIN_PLAYERS) {
      throw new Error(`Need at least ${GameConfig.MIN_PLAYERS} players to start`);
    }
    
    // Check if everyone is ready (in lobby from previous game)
    // Note: When a game ends, isReady should probably be reset to false?
    // Or we use isReady to mean "returned to lobby".
    // If we are in LOBBY state (initial), everyone isReady by default?
    // Yes, in joinRoom we set isReady=true.
    // In returnToLobby logic we need to handle this.
    
    // Let's enforce: All players must be isReady=true
    const unreadyPlayers = room.players.filter(p => !p.isReady);
    if (unreadyPlayers.length > 0) {
        throw new Error('Wait for all players to return to lobby');
    }

    room.state = GameState.PLAYING;
    room.words = this.generateWords(room.language);
    room.currentWordIndex = 0;
    room.currentAnswers = {};
    
    // Reset scores and ready state for game?
    // Actually, keep scores if we want cumulative? Spec implied "Match score is displayed".
    // Usually we reset scores for a new game.
    room.players.forEach(p => {
        p.score = 0;
        p.isReady = false; // Mark them as "in game" / "busy"
    });

    this.updateActivity(roomId);
    return room;
  }

  submitAnswer(roomId: string, playerId: string, answer: string): { room: Room; allAnswered: boolean } {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error('Room not found');
    if (room.state !== GameState.PLAYING) throw new Error('Game not in progress');

    const player = room.players.find(p => p.id === playerId);
    if (!player) throw new Error('Player not found');

    room.currentAnswers[playerId] = answer;
    this.updateActivity(roomId);

    const connectedPlayers = room.players.filter(p => p.isConnected);
    const allAnswered = connectedPlayers.every(p => room.currentAnswers[p.id] !== undefined);

    return { room, allAnswered };
  }

  calculateRoundResults(roomId: string): { room: Room; match: boolean; word: string } {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error('Room not found');

    const answers = Object.values(room.currentAnswers);
    const normalizedAnswers = answers.map(a => a.trim().toLowerCase());
    const uniqueAnswers = new Set(normalizedAnswers);
    
    const match = uniqueAnswers.size === 1 && normalizedAnswers.length > 0; // Check length > 0 to avoid false positive on empty
    const currentWord = room.words[room.currentWordIndex];

    if (match) {
      // Update scores? Spec doesn't explicitly say points, just "chemistry matches".
      // Let's give 1 point for a match to everyone involved.
      room.players.forEach(p => {
        if (room.currentAnswers[p.id]) {
           p.score += 1; 
        }
      });
    }

    return { room, match, word: currentWord };
  }

  nextRound(roomId: string): { room: Room; gameOver: boolean } {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error('Room not found');

    room.currentWordIndex++;
    room.currentAnswers = {};
    this.updateActivity(roomId);

    if (room.currentWordIndex >= room.words.length) {
      room.state = GameState.ENDED;
      // Mark everyone as NOT ready (they need to click Return to Lobby)
      room.players.forEach(p => p.isReady = false);
      return { room, gameOver: true };
    }

    return { room, gameOver: false };
  }
  
  // Deprecated in favor of playerReady logic, but kept if needed for bulk move?
  // The spec wants individual return.
  // We can use this method when the LAST player returns, maybe?
  // Or just use `playerReady` to update state.
  // Let's modify `returnToLobby` to be `finalizeLobbyState` called when room goes to LOBBY.
  checkAndSwitchToLobby(roomId: string): Room {
      const room = this.rooms.get(roomId);
      if (!room) throw new Error('Room not found');
      
      // If everyone is ready, switch state to LOBBY
      // Wait, if state is ENDED, we want to show results.
      // Users click "Back to Lobby".
      // If we switch state to LOBBY, users who haven't clicked will suddenly see Lobby?
      // Yes, that's acceptable usually.
      // BUT the spec says: "Host should wait for all players to return".
      // This implies the HOST waits. It doesn't strictly imply others are forced.
      // However, if the Room State flips to LOBBY, the frontend will render LOBBY for everyone.
      // So, we should ONLY flip to LOBBY when the Host decides?
      // Or maybe we flip to LOBBY when everyone is ready?
      // Let's stick to: Room is ENDED. Players are `isReady=true`.
      // When Host clicks Start Game, we check if everyone isReady.
      // But to "Start Game", we need to be in Lobby?
      // Actually, "Start Game" button is in Lobby.
      // So the Host must see the Lobby.
      // If Room is ENDED, and Host is Ready, Host sees Lobby (with "Waiting for X players").
      // If Room is LOBBY, everyone sees Lobby.
      // So we need to transition ENDED -> LOBBY at some point.
      // If we do it when everyone is ready, it's automatic.
      
      const allReady = room.players.every(p => p.isReady);
      if (allReady && room.state === GameState.ENDED) {
          room.state = GameState.LOBBY;
          room.words = [];
          room.currentWordIndex = 0;
          room.currentAnswers = {};
          
          // Merge spectators
          room.players = [...room.players, ...room.spectators];
          room.spectators = [];
          // Set new players to ready?
          room.players.forEach(p => p.isReady = true); 
      }
      
      return room;
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  private generateRoomId(): string {
    return Math.random().toString(36).substring(2, 6).toUpperCase();
  }

  private generateWords(language: 'en' | 'id'): string[] {
    const pool = language === 'id' ? WORDS_ID : WORDS_EN;
    // Shuffle and pick configured number of words
    return pool.sort(() => 0.5 - Math.random()).slice(0, GameConfig.WORDS_PER_GAME);
  }

  private updateActivity(roomId: string) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.lastActivity = Date.now();
    }
  }

  private cleanupInactiveRooms() {
    const now = Date.now();
    
    for (const [roomId, room] of this.rooms.entries()) {
      if (now - room.lastActivity > GameConfig.ROOM_INACTIVITY_TIMEOUT) {
        this.rooms.delete(roomId);
        console.log(`Room ${roomId} removed due to inactivity`);
      }
    }
  }
}
