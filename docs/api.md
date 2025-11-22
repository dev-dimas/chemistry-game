# API Documentation (Socket.io Events)

This document outlines the WebSocket events used for communication between the client (Frontend) and server (Backend).

## Client -> Server Events

| Event Name | Payload | Description |
| :--- | :--- | :--- |
| `createRoom` | `{ playerName: string, language: 'en' \| 'id', playerId?: string }` | Creates a new room and joins the creator with persistent ID. |
| `joinRoom` | `{ roomId: string, playerName: string, playerId?: string }` | Joins an existing room with persistent ID. |
| `startGame` | `{ roomId: string, playerId: string }` | Starts the game (Creator only). |
| `submitAnswer` | `{ roomId: string, playerId: string, answer: string }` | Submits an answer for the current round. |
| `reconnect` | `{ playerId: string }` | Re-establishes connection for a disconnected player across any room. |
| `playerReady` | `{ roomId: string, playerId: string }` | Marks a player as ready (returned to lobby). |
| `leaveRoom` | `{ roomId: string, playerId: string }` | Removes a player from the room. Destroys room if Host leaves. |
| `kickPlayer` | `{ roomId: string, playerId: string, targetId: string }` | Kicks a player from the room (Creator only). |
| `nextRound` | `{ roomId: string, playerId: string }` | Advances to the next word (Creator only). |

## Server -> Client Events

| Event Name | Payload | Description |
| :--- | :--- | :--- |
| `playerJoined` | `{ player: Player }` | Notifies that a new player has joined. |
| `playerDisconnected` | `{ playerId: string }` | Notifies that a player has disconnected. |
| `playerReconnected` | `{ player: Player }` | Notifies that a player has returned. |
| `playerKicked` | `{ playerId: string }` | Notifies a specific player they have been kicked. |
| `roomUpdate` | `Room` | Sends the full updated room state. |
| `gameStarted` | `Room` | Notifies that the game has started. |
| `playerAnswered` | `{ playerId: string }` | Notifies that a specific player has submitted an answer. |
| `roundResult` | `{ room: Room, match: boolean, word: string }` | Displays results of the current round. |
| `nextRound` | `Room` | Advances the game to the next word. |
| `gameOver` | `Room` | Notifies that the game has finished. |
| `roomDestroyed` | `void` | Notifies that the room has been closed by the host. |
| `error` | `string` | Sends an error message if an action failed. |

## Data Models

### Player
```typescript
interface Player {
  id: string;        // Unique UUID (Persistent)
  socketId: string;  // Socket.io ID
  name: string;      // Display Name
  isCreator: boolean;// Is Room Owner
  score: number;     // Current Score
  isConnected: boolean;
  isReady: boolean;  // Synchronization state
}
```

### Room
```typescript
interface Room {
  id: string;
  state: 'LOBBY' | 'PLAYING' | 'ENDED';
  language: 'en' | 'id';
  players: Player[];
  spectators: Player[];
  words: string[];
  currentWordIndex: number;
  currentAnswers: Record<string, string>;
  lastActivity: number;
}
```
