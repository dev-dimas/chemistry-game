import { Test, TestingModule } from '@nestjs/testing';
import { GameGateway } from './game.gateway';
import { GameService } from './game.service';
import { ConfigService } from '@nestjs/config';

describe('GameGateway - Additional Coverage', () => {
  let gateway: GameGateway;
  let gameService: GameService;

  const mockGameService = {
    createRoom: jest.fn(),
    joinRoom: jest.fn(),
    reconnectPlayer: jest.fn(),
    disconnectPlayer: jest.fn(),
    kickPlayer: jest.fn(),
    startGame: jest.fn(),
    submitAnswer: jest.fn(),
    calculateRoundResults: jest.fn(),
    nextRound: jest.fn(),
    leaveRoom: jest.fn(),
    playerReady: jest.fn(),
    checkAndSwitchToLobby: jest.fn(),
    getRoomPublic: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'CLIENT_URL') return 'http://localhost:5173';
      return null;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameGateway,
        {
          provide: GameService,
          useValue: mockGameService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    gateway = module.get<GameGateway>(GameGateway);
    gameService = module.get<GameService>(GameService);
  });

  describe('checkRoom', () => {
    it('should return exists true when room found', async () => {
      const mockRoom = {
        id: 'TEST',
        state: 'LOBBY',
        language: 'en',
        players: [],
        spectators: [],
        words: [],
        currentWordIndex: 0,
        currentAnswers: {},
        lastActivity: Date.now(),
      };

      mockGameService.getRoomPublic.mockResolvedValue(mockRoom);

      const result = await gateway.checkRoom({ roomId: 'TEST' });

      expect(result).toEqual({ exists: true });
      expect(mockGameService.getRoomPublic).toHaveBeenCalledWith('TEST');
    });

    it('should return exists false when room not found', async () => {
      mockGameService.getRoomPublic.mockResolvedValue(null);

      const result = await gateway.checkRoom({ roomId: 'XXXX' });

      expect(result).toEqual({ exists: false });
    });

    it('should return exists false on error', async () => {
      mockGameService.getRoomPublic.mockRejectedValue(new Error('Database error'));

      const result = await gateway.checkRoom({ roomId: 'TEST' });

      expect(result).toEqual({ exists: false });
    });
  });
});
