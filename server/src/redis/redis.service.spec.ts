import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';
import { Room, GameState } from '../game/interfaces/game.interfaces';

describe('RedisService', () => {
  let service: RedisService;
  let configService: ConfigService;

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'REDIS_URL') return undefined;
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should not be connected without Redis URL', () => {
    expect(service.isConnected()).toBe(false);
  });

  it('should handle setRoom when not connected', async () => {
    await expect(service.setRoom('TEST', mockRoom)).resolves.not.toThrow();
  });

  it('should return null for getRoom when not connected', async () => {
    const result = await service.getRoom('TEST');
    expect(result).toBeNull();
  });

  it('should handle deleteRoom when not connected', async () => {
    await expect(service.deleteRoom('TEST')).resolves.not.toThrow();
  });

  it('should return null for getRoomByPlayerId when not connected', async () => {
    const result = await service.getRoomByPlayerId('player1');
    expect(result).toBeNull();
  });

  it('should return empty array for getAllRooms when not connected', async () => {
    const result = await service.getAllRooms();
    expect(result).toEqual([]);
  });

  it('should return 0 for cleanupInactiveRooms when not connected', async () => {
    const result = await service.cleanupInactiveRooms(60000);
    expect(result).toBe(0);
  });
});
