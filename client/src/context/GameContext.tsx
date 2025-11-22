import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
  useRef,
} from "react";
import { io, Socket } from "socket.io-client";
import { v4 as uuidv4 } from "uuid";

interface Player {
  id: string;
  socketId: string;
  name: string;
  isCreator: boolean;
  score: number;
  isConnected: boolean;
  isReady: boolean;
}

export type GameStateType = "LOBBY" | "PLAYING" | "ENDED";

export const GameState = {
  LOBBY: "LOBBY",
  PLAYING: "PLAYING",
  ENDED: "ENDED",
} as const;

interface Room {
  id: string;
  state: GameStateType;
  language: "en" | "id";
  players: Player[];
  spectators: Player[];
  words: string[];
  currentWordIndex: number;
  currentAnswers: Record<string, string>;
  lastActivity: number;
}

interface GameContextType {
  socket: Socket | null;
  room: Room | null;
  player: Player | null;
  isConnected: boolean;
  createRoom: (name: string, language: "en" | "id") => void;
  joinRoom: (roomId: string, name: string) => void;
  reconnect: (playerId: string) => void;
  startGame: () => void;
  submitAnswer: (answer: string) => void;
  returnToLobby: () => void;
  leaveRoom: () => void;
  kickPlayer: (targetId: string) => void;
  nextRound: () => void;
  error: string | null;
  isReconnecting: boolean;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(true);

  // Persistent Player ID logic
  const persistentPlayerId = useRef<string | null>(null);

  // Helper function to update room and sync player state
  const updateRoom = (updatedRoom: Room) => {
    setRoom(updatedRoom);
    // Sync player state if we have a player
    if (persistentPlayerId.current) {
      const updatedPlayer = 
        updatedRoom.players.find(p => p.id === persistentPlayerId.current) ||
        updatedRoom.spectators.find(p => p.id === persistentPlayerId.current);
      if (updatedPlayer) {
        setPlayer(updatedPlayer);
      }
    }
  };

  useEffect(() => {
    // Initialize player ID on mount
    let pid = localStorage.getItem("chem_playerId");
    if (!pid) {
      pid = uuidv4();
      localStorage.setItem("chem_playerId", pid);
    }
    persistentPlayerId.current = pid;

    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
    console.log("Connecting to backend:", apiUrl);
    
    const newSocket = io(apiUrl);
    setSocket(newSocket);

    newSocket.on("connect", () => {
      setIsConnected(true);
      console.log("Connected to socket", newSocket.id);

      // Attempt reconnect if we think we might be in a room
      // We don't store roomId anymore, but we try to reconnect with playerId
      // The server will tell us if we are in a room.
      if (persistentPlayerId.current) {
        console.log("Attempting auto-reconnect...", {
          playerId: persistentPlayerId.current,
        });
        newSocket.emit(
          "reconnect",
          { playerId: persistentPlayerId.current },
          (response: any) => {
            // Callback for immediate error handling
            if (response && response.error) {
              console.warn("Reconnect failed (server):", response.error);
              setIsReconnecting(false);
            }
          }
        );
      } else {
        setIsReconnecting(false);
      }
    });

    // ... existing listeners ...

    newSocket.on("roomUpdate", (updatedRoom: Room) => {
      console.log("Room update received:", updatedRoom);
      updateRoom(updatedRoom);
    });

    newSocket.on("gameStarted", (updatedRoom: Room) => {
      console.log("Game started:", updatedRoom);
      updateRoom(updatedRoom);
    });

    newSocket.on("roundResult", (data: { room: Room; isMatch: boolean; word: string }) => {
      console.log("Round result:", data);
      updateRoom(data.room);
      
      // Auto-advance to game over if this was the last round
      if (data.room.currentWordIndex === data.room.words.length - 1) {
        // After a short delay, automatically show game over
        setTimeout(() => {
          const currentPlayer = data.room.players.find(p => p.id === persistentPlayerId.current);
          if (currentPlayer?.isCreator) {
            console.log("Auto-advancing to game over screen...");
            newSocket.emit("nextRound", { 
              roomId: data.room.id, 
              playerId: persistentPlayerId.current 
            });
          }
        }, 3000); // 3 second delay to show final round result
      }
    });

    newSocket.on("nextRound", (updatedRoom: Room) => {
      console.log("Next round:", updatedRoom);
      updateRoom(updatedRoom);
    });

    newSocket.on("gameOver", (updatedRoom: Room) => {
      console.log("Game over:", updatedRoom);
      updateRoom(updatedRoom);
    });

    newSocket.on("playerKicked", (data: { playerId: string }) => {
      if (
        persistentPlayerId.current &&
        data.playerId === persistentPlayerId.current
      ) {
        setRoom(null);
        setPlayer(null);
        // Do NOT clear persistent ID, just room state
        // Note: Alert will be shown in App.tsx via AlertContext
      }
    });

    newSocket.on("roomDestroyed", () => {
      setRoom(null);
      setPlayer(null);
      // Note: Alert will be shown in App.tsx via AlertContext
    });

    newSocket.on("reconnected", (data: { room: Room; player: Player }) => {
      console.log("Reconnected successfully", data);
      updateRoom(data.room);
      setPlayer(data.player);
      // Update persistent ID if server returns different one (unlikely)
      if (data.player.id !== persistentPlayerId.current) {
        localStorage.setItem("chem_playerId", data.player.id);
        persistentPlayerId.current = data.player.id;
      }
      setIsReconnecting(false);
    });



    // Listen for errors during reconnect to stop loading state
    newSocket.on("error", (msg: string) => {
      console.error("Socket error:", msg);
      if (isReconnecting) {
        console.warn("Reconnect failed:", msg);
        setIsReconnecting(false);
      }
      setError(msg);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const createRoom = (name: string, language: "en" | "id") => {
    const pid = persistentPlayerId.current;
    socket?.emit(
      "createRoom",
      { playerName: name, language, playerId: pid },
      (response: any) => {
        if (response.room && response.player) {
          setRoom(response.room);
          setPlayer(response.player);
        } else if (response.error) {
          setError(response.error);
        }
      }
    );
  };

  const joinRoom = (roomId: string, name: string) => {
    const pid = persistentPlayerId.current;
    socket?.emit(
      "joinRoom",
      { roomId, playerName: name, playerId: pid },
      (response: any) => {
        if (response.error) {
          setError(response.error);
        } else {
          setRoom(response.room);
          setPlayer(response.player);
        }
      }
    );
  };

  const reconnect = (playerId: string) => {
    // Manually trigger reconnect emit, mostly used if auto-reconnect logic needs retry
    socket?.emit("reconnect", { playerId }, (response: any) => {
      if (response?.error) {
        setError(response.error);
        setIsReconnecting(false);
      }
    });
  };

  const startGame = () => {
    if (room && player) {
      socket?.emit("startGame", { roomId: room.id, playerId: player.id });
    }
  };

  const submitAnswer = (answer: string) => {
    if (room && player) {
      socket?.emit("submitAnswer", {
        roomId: room.id,
        playerId: player.id,
        answer,
      });
    }
  };

  const returnToLobby = () => {
    if (room && player) {
      socket?.emit("playerReady", { roomId: room.id, playerId: player.id });
    }
  };

  const leaveRoom = () => {
    if (room && player) {
      socket?.emit("leaveRoom", { roomId: room.id, playerId: player.id });
      setRoom(null);
      setPlayer(null);
      // Don't clear player ID, just the session state
    }
  };

  const kickPlayer = (targetId: string) => {
    if (room && player) {
      socket?.emit("kickPlayer", {
        roomId: room.id,
        playerId: player.id,
        targetId,
      });
    }
  };

  const nextRound = () => {
    if (room && player) {
      socket?.emit("nextRound", { roomId: room.id, playerId: player.id });
    }
  };

  return (
    <GameContext.Provider
      value={{
        socket,
        room,
        player,
        isConnected,
        isReconnecting,
        createRoom,
        joinRoom,
        reconnect,
        startGame,
        submitAnswer,
        returnToLobby,
        leaveRoom,
        kickPlayer,
        nextRound,
        error,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
};
