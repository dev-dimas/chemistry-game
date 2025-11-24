export interface Player {
  id: string;
  socketId: string;
  name: string;
  isCreator: boolean;
  score: number;
  isConnected: boolean;
  isReady: boolean; // ready in lobby or returned from game
}

export enum GameState {
  LOBBY = 'LOBBY',
  PLAYING = 'PLAYING',
  ENDED = 'ENDED',
}

export interface Room {
  id: string;
  state: GameState;
  language: 'en' | 'id';
  players: Player[];
  spectators: Player[];
  words: string[];
  currentWordIndex: number;
  currentAnswers: Record<string, string>; // playerId -> answer
  lastActivity: number;
}
