import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';

interface Player {
  id: string;
  socketId: string;
  name: string;
  isCreator: boolean;
  score: number;
  isConnected: boolean;
  isReady: boolean;
}

export type GameStateType = 'LOBBY' | 'PLAYING' | 'ENDED';

export const GameState = {
  LOBBY: 'LOBBY',
  PLAYING: 'PLAYING',
  ENDED: 'ENDED',
} as const;

interface Room {
  id: string;
  state: GameStateType;
  language: 'en' | 'id';
  players: Player[];
  spectators: Player[];
  words: string[];
  currentWordIndex: number;
  currentAnswers: Record<string, string>;
  lastActivity: number;
}

interface SocketResponse {
  room?: Room;
  player?: Player;
  error?: string;
}

interface GameStore {
  socket: Socket | null;
  room: Room | null;
  player: Player | null;
  isConnected: boolean;
  isReconnecting: boolean;
  error: string | null;
  persistentPlayerId: string | null;
  
  // Actions
  initializeSocket: () => void;
  createRoom: (name: string, language: 'en' | 'id') => void;
  joinRoom: (roomId: string, name: string) => void;
  reconnect: (playerId: string) => void;
  startGame: () => void;
  submitAnswer: (answer: string) => void;
  returnToLobby: () => void;
  leaveRoom: () => void;
  kickPlayer: (targetId: string) => void;
  nextRound: () => void;
  setError: (error: string | null) => void;
  updateRoom: (room: Room) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  socket: null,
  room: null,
  player: null,
  isConnected: false,
  isReconnecting: true,
  error: null,
  persistentPlayerId: null,

  updateRoom: (updatedRoom: Room) => {
    set({ room: updatedRoom });
    const { persistentPlayerId } = get();
    
    if (persistentPlayerId) {
      const updatedPlayer = 
        updatedRoom.players.find(p => p.id === persistentPlayerId) ||
        updatedRoom.spectators.find(p => p.id === persistentPlayerId);
      if (updatedPlayer) {
        set({ player: updatedPlayer });
      }
    }
  },

  initializeSocket: () => {
    let pid = localStorage.getItem('chem_playerId');
    if (!pid) {
      pid = uuidv4();
      localStorage.setItem('chem_playerId', pid);
    }
    
    set({ persistentPlayerId: pid });

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    console.log('Connecting to backend:', apiUrl);
    
    const newSocket = io(apiUrl);

    newSocket.on('connect', () => {
      set({ isConnected: true });
      console.log('Connected to socket', newSocket.id);

      const { persistentPlayerId } = get();
      if (persistentPlayerId) {
        console.log('Attempting auto-reconnect...', { playerId: persistentPlayerId });
        newSocket.emit('reconnect', { playerId: persistentPlayerId }, (response: SocketResponse) => {
          if (response && response.error) {
            console.warn('Reconnect failed (server):', response.error);
            set({ isReconnecting: false });
          }
        });
      } else {
        set({ isReconnecting: false });
      }
    });

    newSocket.on('roomUpdate', (updatedRoom: Room) => {
      console.log('Room update received:', updatedRoom);
      get().updateRoom(updatedRoom);
    });

    newSocket.on('gameStarted', (updatedRoom: Room) => {
      console.log('Game started:', updatedRoom);
      get().updateRoom(updatedRoom);
    });

    newSocket.on('roundResult', (data: { room: Room; isMatch: boolean; word: string }) => {
      console.log('Round result:', data);
      get().updateRoom(data.room);
      
      if (data.room.currentWordIndex === data.room.words.length - 1) {
        setTimeout(() => {
          const currentPlayer = data.room.players.find(p => p.id === get().persistentPlayerId);
          if (currentPlayer?.isCreator) {
            console.log('Auto-advancing to game over screen...');
            newSocket.emit('nextRound', { 
              roomId: data.room.id, 
              playerId: get().persistentPlayerId 
            });
          }
        }, 3000);
      }
    });

    newSocket.on('nextRound', (updatedRoom: Room) => {
      console.log('Next round:', updatedRoom);
      get().updateRoom(updatedRoom);
    });

    newSocket.on('gameOver', (updatedRoom: Room) => {
      console.log('Game over:', updatedRoom);
      get().updateRoom(updatedRoom);
    });

    newSocket.on('playerKicked', (data: { playerId: string }) => {
      const { persistentPlayerId } = get();
      if (persistentPlayerId && data.playerId === persistentPlayerId) {
        set({ room: null, player: null });
      }
    });

    newSocket.on('roomDestroyed', () => {
      set({ room: null, player: null });
    });

    newSocket.on('reconnected', (data: { room: Room; player: Player }) => {
      console.log('Reconnected successfully', data);
      get().updateRoom(data.room);
      set({ player: data.player, isReconnecting: false });
      
      if (data.player.id !== get().persistentPlayerId) {
        localStorage.setItem('chem_playerId', data.player.id);
        set({ persistentPlayerId: data.player.id });
      }
    });

    newSocket.on('error', (msg: string) => {
      console.error('Socket error:', msg);
      const { isReconnecting } = get();
      if (isReconnecting) {
        console.warn('Reconnect failed:', msg);
        set({ isReconnecting: false });
      }
      set({ error: msg });
    });

    set({ socket: newSocket });
  },

  createRoom: (name: string, language: 'en' | 'id') => {
    const { socket, persistentPlayerId } = get();
    socket?.emit('createRoom', { playerName: name, language, playerId: persistentPlayerId }, (response: SocketResponse) => {
      if (response.room && response.player) {
        set({ room: response.room, player: response.player });
      } else if (response.error) {
        set({ error: response.error });
      }
    });
  },

  joinRoom: (roomId: string, name: string) => {
    const { socket, persistentPlayerId } = get();
    socket?.emit('joinRoom', { roomId, playerName: name, playerId: persistentPlayerId }, (response: SocketResponse) => {
      if (response.error) {
        set({ error: response.error });
      } else {
        set({ room: response.room, player: response.player });
      }
    });
  },

  reconnect: (playerId: string) => {
    const { socket } = get();
    socket?.emit('reconnect', { playerId }, (response: SocketResponse) => {
      if (response?.error) {
        set({ error: response.error, isReconnecting: false });
      }
    });
  },

  startGame: () => {
    const { socket, room, player } = get();
    if (room && player) {
      socket?.emit('startGame', { roomId: room.id, playerId: player.id });
    }
  },

  submitAnswer: (answer: string) => {
    const { socket, room, player } = get();
    if (room && player) {
      socket?.emit('submitAnswer', { roomId: room.id, playerId: player.id, answer });
    }
  },

  returnToLobby: () => {
    const { socket, room, player } = get();
    if (room && player) {
      socket?.emit('playerReady', { roomId: room.id, playerId: player.id });
    }
  },

  leaveRoom: () => {
    const { socket, room, player } = get();
    if (room && player) {
      socket?.emit('leaveRoom', { roomId: room.id, playerId: player.id });
      set({ room: null, player: null });
    }
  },

  kickPlayer: (targetId: string) => {
    const { socket, room, player } = get();
    if (room && player) {
      socket?.emit('kickPlayer', { roomId: room.id, playerId: player.id, targetId });
    }
  },

  nextRound: () => {
    const { socket, room, player } = get();
    if (room && player) {
      socket?.emit('nextRound', { roomId: room.id, playerId: player.id });
    }
  },

  setError: (error: string | null) => set({ error }),
}));
