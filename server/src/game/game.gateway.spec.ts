import { Test, TestingModule } from '@nestjs/testing';
import { GameGateway } from './game.gateway';
import { GameService } from './game.service';
import { ConfigService } from '@nestjs/config';
import { GameState } from './interfaces/game.interfaces';

describe('GameGateway', () => {
  let gateway: GameGateway;
  let gameService: GameService;

  const mockSocket = {
    id: 'socket-123',
    join: jest.fn(),
    leave: jest.fn(),
    emit: jest.fn(),
  };

  const mockServer = {
    to: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    emit: jest.fn(),
    disconnectSockets: jest.fn(),
  };

  const mockRoom = {
    id: 'TEST',
    state: GameState.LOBBY,
    language: 'en' as const,
    players: [
      {
        id: 'player1',
        socketId: 'socket-1',
        name: 'Player 1',
        isCreator: true,
        score: 0,
        isConnected: true,
        isReady: true,
      },
    ],
    spectators: [],
    words: ['test', 'word'],
    currentWordIndex: 0,
    currentAnswers: {},
    lastActivity: Date.now(),
  };

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
    gateway.server = mockServer as any;
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleConnection', () => {
    it('should log client connection', () => {
      const logSpy = jest.spyOn(gateway['logger'], 'log');
      gateway.handleConnection(mockSocket as any);
      expect(logSpy).toHaveBeenCalledWith('Client connected: socket-123');
    });
  });

  describe('handleDisconnect', () => {
    it('should handle client disconnect and emit room update', async () => {
      mockGameService.disconnectPlayer.mockResolvedValue({
        roomId: 'TEST',
        playerId: 'player1',
      });
      mockGameService.getRoomPublic.mockResolvedValue(mockRoom);

      await gateway.handleDisconnect(mockSocket as any);

      expect(mockGameService.disconnectPlayer).toHaveBeenCalledWith(
        'socket-123',
      );
      expect(mockGameService.getRoomPublic).toHaveBeenCalledWith('TEST');
      expect(mockServer.to).toHaveBeenCalledWith('TEST');
      expect(mockServer.emit).toHaveBeenCalledWith('roomUpdate', mockRoom);
    });

    it('should handle disconnect when player not in any room', async () => {
      mockGameService.disconnectPlayer.mockResolvedValue(null);

      await gateway.handleDisconnect(mockSocket as any);

      expect(mockGameService.disconnectPlayer).toHaveBeenCalledWith(
        'socket-123',
      );
      expect(mockServer.emit).not.toHaveBeenCalled();
    });
  });

  describe('createRoom', () => {
    it('should create room successfully', async () => {
      const player = mockRoom.players[0];
      mockGameService.createRoom.mockResolvedValue({ room: mockRoom, player });

      const result = await gateway.createRoom(
        { playerName: 'Test', language: 'en', playerId: undefined },
        mockSocket as any,
      );

      expect(mockGameService.createRoom).toHaveBeenCalledWith(
        'Test',
        'socket-123',
        'en',
        undefined,
      );
      expect(mockSocket.join).toHaveBeenCalledWith('TEST');
      expect(result).toEqual({ room: mockRoom, player });
    });

    it('should handle errors during room creation', async () => {
      mockGameService.createRoom.mockRejectedValue(new Error('Create failed'));

      const result = await gateway.createRoom(
        { playerName: 'Test', language: 'en' },
        mockSocket as any,
      );

      expect(result).toEqual({ error: 'Create failed' });
    });
  });

  describe('joinRoom', () => {
    it('should join room successfully', async () => {
      const player = mockRoom.players[0];
      mockGameService.joinRoom.mockResolvedValue({ room: mockRoom, player });

      const result = await gateway.joinRoom(
        { roomId: 'TEST', playerName: 'Test', playerId: undefined },
        mockSocket as any,
      );

      expect(mockGameService.joinRoom).toHaveBeenCalledWith(
        'TEST',
        'Test',
        'socket-123',
        undefined,
      );
      expect(mockSocket.join).toHaveBeenCalledWith('TEST');
      expect(mockServer.to).toHaveBeenCalledWith('TEST');
      expect(mockServer.emit).toHaveBeenCalledWith('roomUpdate', mockRoom);
      expect(result).toEqual({ room: mockRoom, player });
    });

    it('should handle errors during join', async () => {
      mockGameService.joinRoom.mockRejectedValue(new Error('Room not found'));

      const result = await gateway.joinRoom(
        { roomId: 'XXXX', playerName: 'Test' },
        mockSocket as any,
      );

      expect(result).toEqual({ error: 'Room not found' });
    });
  });

  describe('reconnect', () => {
    it('should reconnect player successfully', async () => {
      const player = mockRoom.players[0];
      mockGameService.reconnectPlayer.mockResolvedValue({
        room: mockRoom,
        player,
      });

      await gateway.reconnect({ playerId: 'player1' }, mockSocket as any);

      expect(mockGameService.reconnectPlayer).toHaveBeenCalledWith(
        'player1',
        'socket-123',
      );
      expect(mockSocket.join).toHaveBeenCalledWith('TEST');
      expect(mockSocket.emit).toHaveBeenCalledWith('reconnected', {
        room: mockRoom,
        player,
      });
      expect(mockServer.to).toHaveBeenCalledWith('TEST');
      expect(mockServer.emit).toHaveBeenCalledWith('roomUpdate', mockRoom);
    });

    it('should handle reconnect errors', async () => {
      mockGameService.reconnectPlayer.mockRejectedValue(
        new Error('Player not found'),
      );

      const result = await gateway.reconnect(
        { playerId: 'unknown' },
        mockSocket as any,
      );

      expect(result).toEqual({ error: 'Player not found' });
    });
  });

  describe('kickPlayer', () => {
    it('should kick player successfully', async () => {
      mockGameService.kickPlayer.mockResolvedValue({
        room: mockRoom,
        kickedPlayerId: 'player2',
      });

      await gateway.kickPlayer({
        roomId: 'TEST',
        playerId: 'player1',
        targetId: 'player2',
      });

      expect(mockGameService.kickPlayer).toHaveBeenCalledWith(
        'TEST',
        'player1',
        'player2',
      );
      expect(mockServer.to).toHaveBeenCalledWith('TEST');
      expect(mockServer.emit).toHaveBeenCalledWith('roomUpdate', mockRoom);
      expect(mockServer.emit).toHaveBeenCalledWith('playerKicked', {
        playerId: 'player2',
      });
    });

    it('should handle kick errors', async () => {
      mockGameService.kickPlayer.mockRejectedValue(
        new Error('Only creator can kick'),
      );

      const result = await gateway.kickPlayer({
        roomId: 'TEST',
        playerId: 'player2',
        targetId: 'player3',
      });

      expect(result).toEqual({ error: 'Only creator can kick' });
    });
  });

  describe('startGame', () => {
    it('should start game successfully', async () => {
      const playingRoom = { ...mockRoom, state: GameState.PLAYING };
      mockGameService.startGame.mockResolvedValue(playingRoom);

      await gateway.startGame({
        roomId: 'TEST',
        playerId: 'player1',
      });

      expect(mockGameService.startGame).toHaveBeenCalledWith('TEST', 'player1');
      expect(mockServer.to).toHaveBeenCalledWith('TEST');
      expect(mockServer.emit).toHaveBeenCalledWith('gameStarted', playingRoom);
    });

    it('should handle start game errors', async () => {
      mockGameService.startGame.mockRejectedValue(
        new Error('Not enough players'),
      );

      const result = await gateway.startGame({
        roomId: 'TEST',
        playerId: 'player1',
      });

      expect(result).toEqual({ error: 'Not enough players' });
    });
  });

  describe('submitAnswer', () => {
    it('should submit answer and emit room update', async () => {
      mockGameService.submitAnswer.mockResolvedValue({
        room: mockRoom,
        allAnswered: false,
      });

      await gateway.submitAnswer({
        roomId: 'TEST',
        playerId: 'player1',
        answer: 'test answer',
      });

      expect(mockGameService.submitAnswer).toHaveBeenCalledWith(
        'TEST',
        'player1',
        'test answer',
      );
      expect(mockServer.to).toHaveBeenCalledWith('TEST');
      expect(mockServer.emit).toHaveBeenCalledWith('roomUpdate', mockRoom);
    });

    it('should emit round results when all answered', async () => {
      mockGameService.submitAnswer.mockResolvedValue({
        room: mockRoom,
        allAnswered: true,
      });
      mockGameService.calculateRoundResults.mockResolvedValue({
        room: mockRoom,
        match: true,
        word: 'test',
      });

      await gateway.submitAnswer({
        roomId: 'TEST',
        playerId: 'player1',
        answer: 'test answer',
      });

      expect(mockGameService.calculateRoundResults).toHaveBeenCalledWith(
        'TEST',
      );
      expect(mockServer.emit).toHaveBeenCalledWith('roundResult', {
        room: mockRoom,
        isMatch: true,
        word: 'test',
      });
    });

    it('should handle submit answer errors', async () => {
      mockGameService.submitAnswer.mockRejectedValue(
        new Error('Game not in progress'),
      );

      const result = await gateway.submitAnswer({
        roomId: 'TEST',
        playerId: 'player1',
        answer: 'test',
      });

      expect(result).toEqual({ error: 'Game not in progress' });
    });
  });

  describe('nextRound', () => {
    it('should advance to next round', async () => {
      mockGameService.getRoomPublic.mockResolvedValue(mockRoom);
      mockGameService.nextRound.mockResolvedValue({
        room: mockRoom,
        gameOver: false,
      });

      await gateway.nextRound({
        roomId: 'TEST',
        playerId: 'player1',
      });

      expect(mockGameService.nextRound).toHaveBeenCalledWith('TEST');
      expect(mockServer.to).toHaveBeenCalledWith('TEST');
      expect(mockServer.emit).toHaveBeenCalledWith('nextRound', mockRoom);
    });

    it('should emit game over when game ends', async () => {
      mockGameService.getRoomPublic.mockResolvedValue(mockRoom);
      mockGameService.nextRound.mockResolvedValue({
        room: mockRoom,
        gameOver: true,
      });

      await gateway.nextRound({
        roomId: 'TEST',
        playerId: 'player1',
      });

      expect(mockServer.emit).toHaveBeenCalledWith('gameOver', mockRoom);
    });

    it('should return error when room not found', async () => {
      mockGameService.getRoomPublic.mockResolvedValue(null);

      const result = await gateway.nextRound({
        roomId: 'XXXX',
        playerId: 'player1',
      });

      expect(result).toEqual({ error: 'Room not found' });
    });

    it('should return error when non-creator tries to advance', async () => {
      const roomWithNonCreator = {
        ...mockRoom,
        players: [{ ...mockRoom.players[0], isCreator: false }],
      };
      mockGameService.getRoomPublic.mockResolvedValue(roomWithNonCreator);

      const result = await gateway.nextRound({
        roomId: 'TEST',
        playerId: 'player1',
      });

      expect(result).toEqual({ error: 'Only creator can advance round' });
    });

    it('should handle next round errors', async () => {
      mockGameService.getRoomPublic.mockResolvedValue(mockRoom);
      mockGameService.nextRound.mockRejectedValue(
        new Error('Next round failed'),
      );

      const result = await gateway.nextRound({
        roomId: 'TEST',
        playerId: 'player1',
      });

      expect(result).toEqual({ error: 'Next round failed' });
    });
  });

  describe('leaveRoom', () => {
    it('should allow player to leave room', async () => {
      mockGameService.leaveRoom.mockResolvedValue({
        room: mockRoom,
        destroyed: false,
      });

      await gateway.leaveRoom(
        { roomId: 'TEST', playerId: 'player1' },
        mockSocket as any,
      );

      expect(mockGameService.leaveRoom).toHaveBeenCalledWith('TEST', 'player1');
      expect(mockSocket.leave).toHaveBeenCalledWith('TEST');
      expect(mockServer.to).toHaveBeenCalledWith('TEST');
      expect(mockServer.emit).toHaveBeenCalledWith('roomUpdate', mockRoom);
    });

    it('should destroy room when creator leaves', async () => {
      mockGameService.leaveRoom.mockResolvedValue({
        destroyed: true,
      });

      await gateway.leaveRoom(
        { roomId: 'TEST', playerId: 'player1' },
        mockSocket as any,
      );

      expect(mockSocket.leave).toHaveBeenCalledWith('TEST');
      expect(mockServer.to).toHaveBeenCalledWith('TEST');
      expect(mockServer.emit).toHaveBeenCalledWith('roomDestroyed');
      expect(mockServer.in).toHaveBeenCalledWith('TEST');
      expect(mockServer.disconnectSockets).toHaveBeenCalled();
    });

    it('should handle leave room errors', async () => {
      mockGameService.leaveRoom.mockRejectedValue(new Error('Room not found'));

      const result = await gateway.leaveRoom(
        { roomId: 'XXXX', playerId: 'player1' },
        mockSocket as any,
      );

      expect(result).toEqual({ error: 'Room not found' });
    });
  });

  describe('playerReady', () => {
    it('should mark player as ready and check lobby switch', async () => {
      mockGameService.playerReady.mockResolvedValue(mockRoom);
      mockGameService.checkAndSwitchToLobby.mockResolvedValue(mockRoom);

      await gateway.playerReady({
        roomId: 'TEST',
        playerId: 'player1',
      });

      expect(mockGameService.playerReady).toHaveBeenCalledWith(
        'TEST',
        'player1',
      );
      expect(mockGameService.checkAndSwitchToLobby).toHaveBeenCalledWith(
        'TEST',
      );
      expect(mockServer.to).toHaveBeenCalledWith('TEST');
      expect(mockServer.emit).toHaveBeenCalledWith('roomUpdate', mockRoom);
    });

    it('should handle player ready errors', async () => {
      mockGameService.playerReady.mockRejectedValue(
        new Error('Player not found'),
      );

      const result = await gateway.playerReady({
        roomId: 'TEST',
        playerId: 'unknown',
      });

      expect(result).toEqual({ error: 'Player not found' });
    });
  });
});
