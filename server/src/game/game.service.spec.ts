import { Test, TestingModule } from '@nestjs/testing';
import { GameService } from './game.service';
import { RedisService } from '../redis/redis.service';
import { GameState } from './interfaces/game.interfaces';

describe('GameService', () => {
  let service: GameService;
  let redisService: RedisService;

  const mockRedisService = {
    isConnected: jest.fn().mockReturnValue(false),
    setRoom: jest.fn(),
    getRoom: jest.fn(),
    deleteRoom: jest.fn(),
    getRoomByPlayerId: jest.fn(),
    getAllRooms: jest.fn(),
    cleanupInactiveRooms: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameService,
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<GameService>(GameService);
    redisService = module.get<RedisService>(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createRoom', () => {
    it('should create a room with valid data', async () => {
      const { room, player } = await service.createRoom(
        'John',
        'socket-123',
        'en',
      );

      expect(room).toBeDefined();
      expect(room.id).toHaveLength(4);
      expect(room.state).toBe(GameState.LOBBY);
      expect(room.language).toBe('en');
      expect(room.players).toHaveLength(1);
      expect(player.name).toBe('John');
      expect(player.isCreator).toBe(true);
      expect(player.isReady).toBe(true);
    });

    it('should use provided playerId', async () => {
      const customId = 'custom-player-id';
      const { player } = await service.createRoom(
        'Jane',
        'socket-456',
        'id',
        customId,
      );

      expect(player.id).toBe(customId);
    });

    it('should create room with Indonesian language', async () => {
      const { room } = await service.createRoom('Test', 'socket-789', 'id');

      expect(room.language).toBe('id');
    });
  });

  describe('joinRoom', () => {
    it('should allow player to join existing room', async () => {
      const { room: createdRoom } = await service.createRoom(
        'Creator',
        'socket-1',
        'en',
      );
      const { room, player } = await service.joinRoom(
        createdRoom.id,
        'Joiner',
        'socket-2',
      );

      expect(room.players).toHaveLength(2);
      expect(player.name).toBe('Joiner');
      expect(player.isCreator).toBe(false);
    });

    it('should throw error when room not found', async () => {
      await expect(
        service.joinRoom('XXXX', 'Player', 'socket-x'),
      ).rejects.toThrow('Room not found');
    });

    it('should throw error when room is full', async () => {
      const { room } = await service.createRoom('Creator', 'socket-1', 'en');

      // Fill room to max capacity (10 players)
      for (let i = 2; i <= 10; i++) {
        await service.joinRoom(room.id, `Player${i}`, `socket-${i}`);
      }

      await expect(
        service.joinRoom(room.id, 'Player11', 'socket-11'),
      ).rejects.toThrow('Room is full');
    });

    it('should reconnect existing player', async () => {
      const playerId = 'existing-player';
      const { room } = await service.createRoom(
        'Creator',
        'socket-1',
        'en',
        playerId,
      );

      const { player } = await service.joinRoom(
        room.id,
        'Updated Name',
        'new-socket',
        playerId,
      );

      expect(player.id).toBe(playerId);
      expect(player.name).toBe('Updated Name');
      expect(player.socketId).toBe('new-socket');
    });

    it('should add player as spectator when game is playing', async () => {
      const { room } = await service.createRoom('Creator', 'socket-1', 'en');
      await service.joinRoom(room.id, 'Player2', 'socket-2');
      await service.startGame(room.id, room.players[0].id);

      const { room: updatedRoom, player } = await service.joinRoom(
        room.id,
        'Spectator',
        'socket-3',
      );

      expect(updatedRoom.spectators).toHaveLength(1);
      expect(player.name).toBe('Spectator');
    });
  });

  describe('reconnectPlayer', () => {
    it('should reconnect player to their room', async () => {
      const playerId = 'reconnect-test';
      const { room } = await service.createRoom(
        'Test',
        'old-socket',
        'en',
        playerId,
      );

      const { room: reconnectedRoom, player } = await service.reconnectPlayer(
        playerId,
        'new-socket',
      );

      expect(reconnectedRoom.id).toBe(room.id);
      expect(player.socketId).toBe('new-socket');
      expect(player.isConnected).toBe(true);
    });

    it('should throw error when player not found', async () => {
      await expect(
        service.reconnectPlayer('non-existent', 'socket-x'),
      ).rejects.toThrow('Player not found in any room');
    });
  });

  describe('disconnectPlayer', () => {
    it('should mark player as disconnected', async () => {
      const socketId = 'socket-disconnect-test';
      const { room } = await service.createRoom('Test', socketId, 'en');

      const result = await service.disconnectPlayer(socketId);

      expect(result).toBeDefined();
      expect(result?.roomId).toBe(room.id);
      expect(result?.playerId).toBe(room.players[0].id);
    });

    it('should return null when socket not found', async () => {
      const result = await service.disconnectPlayer('non-existent-socket');
      expect(result).toBeNull();
    });
  });

  describe('kickPlayer', () => {
    it('should allow creator to kick player', async () => {
      const { room, player: creator } = await service.createRoom(
        'Creator',
        'socket-1',
        'en',
      );
      const { player: targetPlayer } = await service.joinRoom(
        room.id,
        'Target',
        'socket-2',
      );

      const { room: updatedRoom, kickedPlayerId } = await service.kickPlayer(
        room.id,
        creator.id,
        targetPlayer.id,
      );

      expect(updatedRoom?.players).toHaveLength(1);
      expect(kickedPlayerId).toBe(targetPlayer.id);
    });

    it('should throw error when room not found', async () => {
      await expect(
        service.kickPlayer('XXXX', 'player1', 'player2'),
      ).rejects.toThrow('Room not found');
    });

    it('should throw error when non-creator tries to kick', async () => {
      const { room } = await service.createRoom('Creator', 'socket-1', 'en');
      const { player: normalPlayer } = await service.joinRoom(
        room.id,
        'Normal',
        'socket-2',
      );
      const { player: target } = await service.joinRoom(
        room.id,
        'Target',
        'socket-3',
      );

      await expect(
        service.kickPlayer(room.id, normalPlayer.id, target.id),
      ).rejects.toThrow('Only creator can kick players');
    });
  });

  describe('leaveRoom', () => {
    it('should remove player from room', async () => {
      const { room } = await service.createRoom('Creator', 'socket-1', 'en');
      const { player } = await service.joinRoom(room.id, 'Leaver', 'socket-2');

      const result = await service.leaveRoom(room.id, player.id);

      expect(result.destroyed).toBe(false);
      expect(result.room?.players).toHaveLength(1);
    });

    it('should destroy room when creator leaves', async () => {
      const { room, player } = await service.createRoom(
        'Creator',
        'socket-1',
        'en',
      );

      const result = await service.leaveRoom(room.id, player.id);

      expect(result.destroyed).toBe(true);
    });

    it('should throw error when room not found', async () => {
      await expect(service.leaveRoom('XXXX', 'player1')).rejects.toThrow(
        'Room not found',
      );
    });

    it('should throw error when player not found in room', async () => {
      const { room } = await service.createRoom('Creator', 'socket-1', 'en');

      await expect(service.leaveRoom(room.id, 'non-existent')).rejects.toThrow(
        'Player not found in room',
      );
    });
  });

  describe('playerReady', () => {
    it('should mark player as ready', async () => {
      const { room, player } = await service.createRoom(
        'Test',
        'socket-1',
        'en',
      );
      player.isReady = false;

      const updatedRoom = await service.playerReady(room.id, player.id);

      expect(updatedRoom.players[0].isReady).toBe(true);
    });

    it('should throw error when room not found', async () => {
      await expect(service.playerReady('XXXX', 'player1')).rejects.toThrow(
        'Room not found',
      );
    });
  });

  describe('startGame', () => {
    it('should start game with valid conditions', async () => {
      const { room, player: creator } = await service.createRoom(
        'Creator',
        'socket-1',
        'en',
      );
      await service.joinRoom(room.id, 'Player2', 'socket-2');

      const startedRoom = await service.startGame(room.id, creator.id);

      expect(startedRoom.state).toBe(GameState.PLAYING);
      expect(startedRoom.words.length).toBeGreaterThan(0);
      expect(startedRoom.currentWordIndex).toBe(0);
      expect(startedRoom.players.every((p) => p.score === 0)).toBe(true);
    });

    it('should throw error when room not found', async () => {
      await expect(service.startGame('XXXX', 'player1')).rejects.toThrow(
        'Room not found',
      );
    });

    it('should throw error when non-creator tries to start', async () => {
      const { room } = await service.createRoom('Creator', 'socket-1', 'en');
      const { player } = await service.joinRoom(room.id, 'Normal', 'socket-2');

      await expect(service.startGame(room.id, player.id)).rejects.toThrow(
        'Only creator can start game',
      );
    });

    it('should throw error when not enough players', async () => {
      const { room, player } = await service.createRoom(
        'Creator',
        'socket-1',
        'en',
      );

      await expect(service.startGame(room.id, player.id)).rejects.toThrow(
        'Need at least 2 players to start',
      );
    });

    it('should throw error when players not ready', async () => {
      const { room, player: creator } = await service.createRoom(
        'Creator',
        'socket-1',
        'en',
      );
      const { player: player2 } = await service.joinRoom(
        room.id,
        'Player2',
        'socket-2',
      );
      player2.isReady = false;

      await expect(service.startGame(room.id, creator.id)).rejects.toThrow(
        'Wait for all players to return to lobby',
      );
    });
  });

  describe('submitAnswer', () => {
    it('should submit answer successfully', async () => {
      const { room, player: creator } = await service.createRoom(
        'Creator',
        'socket-1',
        'en',
      );
      await service.joinRoom(room.id, 'Player2', 'socket-2');
      await service.startGame(room.id, creator.id);

      const { room: updatedRoom, allAnswered } = await service.submitAnswer(
        room.id,
        creator.id,
        'test answer',
      );

      expect(updatedRoom.currentAnswers[creator.id]).toBe('test answer');
      expect(allAnswered).toBe(false);
    });

    it('should detect when all players answered', async () => {
      const { room, player: creator } = await service.createRoom(
        'Creator',
        'socket-1',
        'en',
      );
      const { player: player2 } = await service.joinRoom(
        room.id,
        'Player2',
        'socket-2',
      );
      await service.startGame(room.id, creator.id);

      await service.submitAnswer(room.id, creator.id, 'answer1');
      const { allAnswered } = await service.submitAnswer(
        room.id,
        player2.id,
        'answer2',
      );

      expect(allAnswered).toBe(true);
    });

    it('should throw error when room not found', async () => {
      await expect(
        service.submitAnswer('XXXX', 'player1', 'answer'),
      ).rejects.toThrow('Room not found');
    });

    it('should throw error when game not in progress', async () => {
      const { room, player } = await service.createRoom(
        'Test',
        'socket-1',
        'en',
      );
      await service.joinRoom(room.id, 'Player2', 'socket-2');

      await expect(
        service.submitAnswer(room.id, player.id, 'answer'),
      ).rejects.toThrow('Game not in progress');
    });

    it('should throw error when player not found', async () => {
      const { room, player } = await service.createRoom(
        'Creator',
        'socket-1',
        'en',
      );
      await service.joinRoom(room.id, 'Player2', 'socket-2');
      await service.startGame(room.id, player.id);

      await expect(
        service.submitAnswer(room.id, 'non-existent', 'answer'),
      ).rejects.toThrow('Player not found');
    });
  });

  describe('calculateRoundResults', () => {
    it('should detect matching answers', async () => {
      const { room, player: creator } = await service.createRoom(
        'Creator',
        'socket-1',
        'en',
      );
      const { player: player2 } = await service.joinRoom(
        room.id,
        'Player2',
        'socket-2',
      );
      await service.startGame(room.id, creator.id);

      await service.submitAnswer(room.id, creator.id, 'Apple');
      await service.submitAnswer(room.id, player2.id, 'apple');

      const { match } = await service.calculateRoundResults(room.id);

      expect(match).toBe(true);
    });

    it('should detect non-matching answers', async () => {
      const { room, player: creator } = await service.createRoom(
        'Creator',
        'socket-1',
        'en',
      );
      const { player: player2 } = await service.joinRoom(
        room.id,
        'Player2',
        'socket-2',
      );
      await service.startGame(room.id, creator.id);

      await service.submitAnswer(room.id, creator.id, 'Apple');
      await service.submitAnswer(room.id, player2.id, 'Orange');

      const { match } = await service.calculateRoundResults(room.id);

      expect(match).toBe(false);
    });

    it('should increment scores on match', async () => {
      const { room, player: creator } = await service.createRoom(
        'Creator',
        'socket-1',
        'en',
      );
      const { player: player2 } = await service.joinRoom(
        room.id,
        'Player2',
        'socket-2',
      );
      await service.startGame(room.id, creator.id);

      await service.submitAnswer(room.id, creator.id, 'test');
      await service.submitAnswer(room.id, player2.id, 'test');

      const { room: resultRoom } = await service.calculateRoundResults(room.id);

      expect(resultRoom.players.every((p) => p.score === 1)).toBe(true);
    });
  });

  describe('nextRound', () => {
    it('should advance to next round', async () => {
      const { room, player: creator } = await service.createRoom(
        'Creator',
        'socket-1',
        'en',
      );
      await service.joinRoom(room.id, 'Player2', 'socket-2');
      const startedRoom = await service.startGame(room.id, creator.id);

      const { room: nextRoom, gameOver } = await service.nextRound(
        startedRoom.id,
      );

      expect(nextRoom.currentWordIndex).toBe(1);
      expect(Object.keys(nextRoom.currentAnswers)).toHaveLength(0);
      expect(gameOver).toBe(false);
    });

    it('should detect game over', async () => {
      const { room, player: creator } = await service.createRoom(
        'Creator',
        'socket-1',
        'en',
      );
      await service.joinRoom(room.id, 'Player2', 'socket-2');
      const startedRoom = await service.startGame(room.id, creator.id);

      // Advance to last round
      let currentRoom = startedRoom;
      for (let i = 0; i < startedRoom.words.length; i++) {
        const result = await service.nextRound(currentRoom.id);
        currentRoom = result.room;
        if (result.gameOver) {
          expect(result.room.state).toBe(GameState.ENDED);
          expect(result.room.players.every((p) => !p.isReady)).toBe(true);
          break;
        }
      }
    });
  });

  describe('checkAndSwitchToLobby', () => {
    it('should switch to lobby when all players ready after game end', async () => {
      const { room, player: creator } = await service.createRoom(
        'Creator',
        'socket-1',
        'en',
      );
      const { player: player2 } = await service.joinRoom(
        room.id,
        'Player2',
        'socket-2',
      );
      await service.startGame(room.id, creator.id);

      // Manually set room to ENDED state
      const gameRoom = await service.getRoomPublic(room.id);
      if (gameRoom) {
        gameRoom.state = GameState.ENDED;
        await service.playerReady(room.id, creator.id);
        await service.playerReady(room.id, player2.id);

        const lobbyRoom = await service.checkAndSwitchToLobby(room.id);

        expect(lobbyRoom.state).toBe(GameState.LOBBY);
        expect(lobbyRoom.spectators).toHaveLength(0);
      }
    });
  });

  describe('getRoomPublic', () => {
    it('should return room if exists', async () => {
      const { room } = await service.createRoom('Test', 'socket-1', 'en');

      const foundRoom = await service.getRoomPublic(room.id);

      expect(foundRoom).toBeDefined();
      expect(foundRoom?.id).toBe(room.id);
    });

    it('should return null if room does not exist', async () => {
      const foundRoom = await service.getRoomPublic('XXXX');

      expect(foundRoom).toBeNull();
    });
  });
});
