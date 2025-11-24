import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';
import { Room, GameState } from '../game/interfaces/game.interfaces';
import Redis from 'ioredis';

describe('RedisService Integration', () => {
  let service: RedisService;

  const mockRoom: Room = {
    id: 'TEST',
    state: GameState.LOBBY,
    language: 'en',
    players: [
      {
        id: 'player1',
        socketId: 'socket1',
        name: 'Test Player',
        isCreator: true,
        score: 0,
        isConnected: true,
        isReady: true,
      },
    ],
    spectators: [],
    words: [],
    currentWordIndex: 0,
    currentAnswers: {},
    lastActivity: Date.now(),
  };

  describe('With Redis Connection', () => {
    let mockRedisClient: any;

    beforeEach(async () => {
      mockRedisClient = {
        status: 'ready',
        set: jest.fn().mockResolvedValue('OK'),
        get: jest.fn().mockResolvedValue(null),
        del: jest.fn().mockResolvedValue(1),
        keys: jest.fn().mockResolvedValue([]),
        quit: jest.fn().mockResolvedValue(undefined),
      };

      jest.spyOn(Redis.prototype, 'constructor' as any).mockImplementation(() => mockRedisClient);

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          RedisService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                if (key === 'REDIS_URL') return 'redis://localhost:6379';
                return null;
              }),
            },
          },
        ],
      }).compile();

      service = module.get<RedisService>(RedisService);
      // Manually set the client for testing
      (service as any).client = mockRedisClient;
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should connect to Redis when URL is provided', () => {
      expect(service.isConnected()).toBe(true);
    });

    it('should set room in Redis', async () => {
      await service.setRoom('TEST', mockRoom);

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'room:TEST',
        JSON.stringify(mockRoom),
        'EX',
        3600,
      );
    });

    it('should set player-to-room mapping when setting room', async () => {
      await service.setRoom('TEST', mockRoom);

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'player:room:player1',
        'TEST',
        'EX',
        3600,
      );
    });

    it('should get room from Redis', async () => {
      mockRedisClient.get.mockResolvedValue(JSON.stringify(mockRoom));

      const result = await service.getRoom('TEST');

      expect(result).toEqual(mockRoom);
      expect(mockRedisClient.get).toHaveBeenCalledWith('room:TEST');
    });

    it('should return null when room not found', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const result = await service.getRoom('XXXX');

      expect(result).toBeNull();
    });

    it('should delete room from Redis', async () => {
      await service.deleteRoom('TEST');

      expect(mockRedisClient.del).toHaveBeenCalledWith('room:TEST');
    });

    it('should get room by player ID', async () => {
      mockRedisClient.get.mockResolvedValue('TEST');

      const result = await service.getRoomByPlayerId('player1');

      expect(result).toBe('TEST');
      expect(mockRedisClient.get).toHaveBeenCalledWith('player:room:player1');
    });

    it('should return null when player not in any room', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const result = await service.getRoomByPlayerId('unknown');

      expect(result).toBeNull();
    });

    it('should get all rooms', async () => {
      const room2 = { ...mockRoom, id: 'TEST2' };
      mockRedisClient.keys.mockResolvedValue(['room:TEST', 'room:TEST2']);
      mockRedisClient.get
        .mockResolvedValueOnce(JSON.stringify(mockRoom))
        .mockResolvedValueOnce(JSON.stringify(room2));

      const result = await service.getAllRooms();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('TEST');
      expect(result[1].id).toBe('TEST2');
    });

    it('should return empty array when no rooms exist', async () => {
      mockRedisClient.keys.mockResolvedValue([]);

      const result = await service.getAllRooms();

      expect(result).toEqual([]);
    });

    it('should cleanup inactive rooms', async () => {
      const oldRoom = {
        ...mockRoom,
        lastActivity: Date.now() - 20 * 60 * 1000, // 20 minutes ago
      };
      const recentRoom = { ...mockRoom, id: 'TEST2', lastActivity: Date.now() };

      mockRedisClient.keys.mockResolvedValue(['room:TEST', 'room:TEST2']);
      mockRedisClient.get
        .mockResolvedValueOnce(JSON.stringify(oldRoom))
        .mockResolvedValueOnce(JSON.stringify(recentRoom));

      const cleaned = await service.cleanupInactiveRooms(15 * 60 * 1000); // 15 min timeout

      expect(cleaned).toBe(1);
      expect(mockRedisClient.del).toHaveBeenCalledWith('room:TEST');
      expect(mockRedisClient.del).not.toHaveBeenCalledWith('room:TEST2');
    });

    it('should handle error when getting specific room during cleanup', async () => {
      mockRedisClient.keys.mockResolvedValue(['room:TEST']);
      mockRedisClient.get.mockRejectedValue(new Error('Get error'));

      const cleaned = await service.cleanupInactiveRooms(15 * 60 * 1000);

      expect(cleaned).toBe(0);
    });

    it('should handle errors during setRoom gracefully', async () => {
      mockRedisClient.set.mockRejectedValue(new Error('Redis error'));

      await expect(service.setRoom('TEST', mockRoom)).resolves.not.toThrow();
    });

    it('should handle errors during getRoom gracefully', async () => {
      mockRedisClient.get.mockRejectedValue(new Error('Redis error'));

      const result = await service.getRoom('TEST');

      expect(result).toBeNull();
    });

    it('should handle errors during deleteRoom gracefully', async () => {
      mockRedisClient.del.mockRejectedValue(new Error('Redis error'));

      await expect(service.deleteRoom('TEST')).resolves.not.toThrow();
    });

    it('should handle errors during getRoomByPlayerId gracefully', async () => {
      mockRedisClient.get.mockRejectedValue(new Error('Redis error'));

      const result = await service.getRoomByPlayerId('player1');

      expect(result).toBeNull();
    });

    it('should handle errors during getAllRooms gracefully', async () => {
      mockRedisClient.keys.mockRejectedValue(new Error('Redis error'));

      const result = await service.getAllRooms();

      expect(result).toEqual([]);
    });

    it('should handle errors during cleanupInactiveRooms gracefully', async () => {
      mockRedisClient.keys.mockRejectedValue(new Error('Redis error'));

      const result = await service.cleanupInactiveRooms(15 * 60 * 1000);

      expect(result).toBe(0);
    });

    it('should quit Redis connection on module destroy', async () => {
      await service.onModuleDestroy();

      expect(mockRedisClient.quit).toHaveBeenCalled();
    });

    it('should handle null data when getting all rooms', async () => {
      mockRedisClient.keys.mockResolvedValue(['room:TEST']);
      mockRedisClient.get.mockResolvedValue(null);

      const result = await service.getAllRooms();

      expect(result).toEqual([]);
    });

    it('should set room with spectators', async () => {
      const roomWithSpectators = {
        ...mockRoom,
        spectators: [
          {
            id: 'spectator1',
            socketId: 'socket2',
            name: 'Spectator',
            isCreator: false,
            score: 0,
            isConnected: true,
            isReady: false,
          },
        ],
      };

      await service.setRoom('TEST', roomWithSpectators);

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'player:room:spectator1',
        'TEST',
        'EX',
        3600,
      );
    });
  });
});
