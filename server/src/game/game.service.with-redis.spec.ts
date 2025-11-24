import { Test, TestingModule } from '@nestjs/testing';
import { GameService } from './game.service';
import { RedisService } from '../redis/redis.service';
import { GameState, Room } from './interfaces/game.interfaces';

describe('GameService - With Redis Enabled', () => {
  let service: GameService;
  let redisService: RedisService;

  const mockRoom: Room = {
    id: 'TEST123',
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

  const mockRedisService = {
    isConnected: jest.fn(),
    setRoom: jest.fn().mockResolvedValue(undefined),
    getRoom: jest.fn(),
    deleteRoom: jest.fn().mockResolvedValue(undefined),
    getRoomByPlayerId: jest.fn(),
    getAllRooms: jest.fn().mockResolvedValue([]),
    cleanupInactiveRooms: jest.fn().mockResolvedValue(0),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Mock Redis as CONNECTED for these tests
    mockRedisService.isConnected.mockReturnValue(true);
    mockRedisService.getRoom.mockResolvedValue(null);
    mockRedisService.getRoomByPlayerId.mockResolvedValue(null);

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
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('should use Redis getRoom when connected', async () => {
    mockRedisService.getRoom.mockResolvedValue(mockRoom);

    const room = await service.getRoomPublic('TEST123');

    expect(room).toBeDefined();
    expect(room?.id).toBe('TEST123');
    expect(mockRedisService.getRoom).toHaveBeenCalledWith('TEST123');
  });

  it('should use Redis setRoom when saving', async () => {
    const { room } = await service.createRoom('Test', 'socket1', 'en');

    expect(mockRedisService.setRoom).toHaveBeenCalled();
    expect(mockRedisService.setRoom).toHaveBeenCalledWith(room.id, expect.objectContaining({ id: room.id }));
  });

  it('should use Redis deleteRoom when deleting', async () => {
    const { room, player } = await service.createRoom('Test', 'socket1', 'en');

    await service.leaveRoom(room.id, player.id);

    expect(mockRedisService.deleteRoom).toHaveBeenCalledWith(room.id);
  });

  it('should use Redis getAllRooms when connected', async () => {
    mockRedisService.getAllRooms.mockResolvedValue([mockRoom]);

    await service.disconnectPlayer('some-socket');

    expect(mockRedisService.getAllRooms).toHaveBeenCalled();
  });

  it('should use Redis reconnectPlayer path when room found', async () => {
    const playerId = 'player1';
    
    mockRedisService.getRoomByPlayerId.mockResolvedValue('TEST123');
    mockRedisService.getRoom.mockResolvedValue(mockRoom);

    const { room, player } = await service.reconnectPlayer(playerId, 'new-socket');

    expect(room.id).toBe('TEST123');
    expect(player.socketId).toBe('new-socket');
    expect(mockRedisService.getRoomByPlayerId).toHaveBeenCalledWith(playerId);
  });

});

