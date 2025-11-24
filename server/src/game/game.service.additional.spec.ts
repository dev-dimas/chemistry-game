import { Test, TestingModule } from '@nestjs/testing';
import { GameService } from './game.service';
import { RedisService } from '../redis/redis.service';
import { GameState } from './interfaces/game.interfaces';

describe('GameService - Additional Coverage', () => {
  let service: GameService;

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
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('disconnectPlayer - spectator', () => {
    it('should disconnect spectator', async () => {
      const { room } = await service.createRoom('Creator', 'socket-1', 'en');
      await service.joinRoom(room.id, 'Player2', 'socket-2');
      await service.startGame(room.id, room.players[0].id);
      
      // Join as spectator
      await service.joinRoom(room.id, 'Spectator', 'socket-3');

      const result = await service.disconnectPlayer('socket-3');

      expect(result).toBeDefined();
      expect(result?.roomId).toBe(room.id);
    });
  });

  describe('leaveRoom - spectator', () => {
    it('should remove spectator from room', async () => {
      const { room } = await service.createRoom('Creator', 'socket-1', 'en');
      await service.joinRoom(room.id, 'Player2', 'socket-2');
      await service.startGame(room.id, room.players[0].id);
      
      // Join as spectator
      const { player: spectator } = await service.joinRoom(room.id, 'Spectator', 'socket-3');

      const result = await service.leaveRoom(room.id, spectator.id);

      expect(result.destroyed).toBe(false);
      expect(result.room?.spectators).toHaveLength(0);
    });
  });

  describe('checkAndSwitchToLobby - spectator merging', () => {
    it('should merge spectators when switching to lobby', async () => {
      const { room, player: creator } = await service.createRoom('Creator', 'socket-1', 'en');
      const { player: player2 } = await service.joinRoom(room.id, 'Player2', 'socket-2');
      await service.startGame(room.id, creator.id);
      
      // Get room and add spectator
      const gameRoom = await service.getRoomPublic(room.id);
      if (gameRoom) {
        gameRoom.spectators.push({
          id: 'spec1',
          socketId: 'socket-3',
          name: 'Spectator',
          isCreator: false,
          score: 0,
          isConnected: true,
          isReady: false,
        });
        
        // Transition to ended and mark players ready
        gameRoom.state = GameState.ENDED;
        await service.playerReady(room.id, creator.id);
        await service.playerReady(room.id, player2.id);

        const lobbyRoom = await service.checkAndSwitchToLobby(room.id);

        expect(lobbyRoom.state).toBe(GameState.LOBBY);
        expect(lobbyRoom.players).toHaveLength(3);
        expect(lobbyRoom.spectators).toHaveLength(0);
      }
    });
  });

  describe('reconnectPlayer - fallback search', () => {
    it('should use fallback in-memory search when Redis lookup fails', async () => {
      const playerId = 'test-player';
      const { room } = await service.createRoom('Test', 'old-socket', 'en', playerId);

      // Ensure Redis returns null so it falls back to in-memory
      mockRedisService.getRoomByPlayerId.mockResolvedValue(null);

      const { room: reconnectedRoom, player } = await service.reconnectPlayer(playerId, 'new-socket');

      expect(reconnectedRoom.id).toBe(room.id);
      expect(player.socketId).toBe('new-socket');
    });

    it('should reconnect spectator using fallback search', async () => {
      const { room } = await service.createRoom('Creator', 'socket-1', 'en');
      await service.joinRoom(room.id, 'Player2', 'socket-2');
      await service.startGame(room.id, room.players[0].id);
      
      // Join as spectator
      const spectatorId = 'spectator-id';
      await service.joinRoom(room.id, 'Spectator', 'socket-3', spectatorId);

      mockRedisService.getRoomByPlayerId.mockResolvedValue(null);

      const { room: reconnectedRoom, player } = await service.reconnectPlayer(spectatorId, 'new-socket');

      expect(reconnectedRoom.id).toBe(room.id);
      expect(player.id).toBe(spectatorId);
    });
  });
});
