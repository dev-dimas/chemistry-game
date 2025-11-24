# API Documentation (WebSocket Events)

This document outlines the WebSocket events used for real-time communication between the client and server using Socket.io.

## Overview

All WebSocket events use **DTO validation** with `class-validator` for type safety and input validation. Invalid requests will receive an error response.

## Client -> Server Events

| Event Name | Payload | Validation | Description |
| :--- | :--- | :--- | :--- |
| `createRoom` | `{ playerName: string, language: 'en' \| 'id', playerId?: string }` | playerName: 1-12 chars, language: enum | Creates a new room and joins the creator with persistent ID. |
| `joinRoom` | `{ roomId: string, playerName: string, playerId?: string }` | roomId: exactly 4 chars, playerName: 1-12 chars | Joins an existing room with persistent ID. |
| `checkRoom` | `{ roomId: string }` | roomId: required string | **NEW**: Checks if a room exists before joining. Returns `{ exists: boolean }`. |
| `startGame` | `{ roomId: string, playerId: string }` | Both fields required | Starts the game (Creator only). |
| `submitAnswer` | `{ roomId: string, playerId: string, answer: string }` | answer: 1-50 chars | Submits an answer for the current round. |
| `reconnect` | `{ playerId: string }` | playerId: required | Re-establishes connection for a disconnected player across any room. |
| `playerReady` | `{ roomId: string, playerId: string }` | Both fields required | Marks a player as ready (returned to lobby). |
| `leaveRoom` | `{ roomId: string, playerId: string }` | Both fields required | Removes a player from the room. Destroys room if Host leaves. |
| `kickPlayer` | `{ roomId: string, playerId: string, targetId: string }` | All fields required | Kicks a player from the room (Creator only). |
| `nextRound` | `{ roomId: string, playerId: string }` | Both fields required | Advances to the next word (Creator only). |

## Server -> Client Events

| Event Name | Payload | Description |
| :--- | :--- | :--- |
| `reconnected` | `{ room: Room, player: Player }` | Sent to reconnecting client with their room and player data. |
| `roomUpdate` | `Room` | Broadcasts the full updated room state to all players in the room. |
| `gameStarted` | `Room` | Notifies all players that the game has started. |
| `roundResult` | `{ room: Room, isMatch: boolean, word: string }` | Displays results of the current round. `isMatch` is true if all answers matched. |
| `nextRound` | `Room` | Advances the game to the next word. |
| `gameOver` | `Room` | Notifies that the game has finished with final scores. |
| `playerKicked` | `{ playerId: string }` | Broadcasts to the room that a player was kicked. |
| `roomDestroyed` | `void` | Notifies all players that the room has been closed by the host. |
| `error` | `{ message: string, timestamp: string }` | Sends a formatted error message if an action failed. |

## Data Models

### Player
```typescript
interface Player {
  id: string;          // Unique UUID (Persistent across sessions)
  socketId: string;    // Current Socket.io connection ID
  name: string;        // Display name (1-12 characters)
  isCreator: boolean;  // Is room owner/host
  score: number;       // Current score in the game
  isConnected: boolean;// Connection status
  isReady: boolean;    // Ready status for lobby/game transitions
}
```

### Room
```typescript
interface Room {
  id: string;                            // 4-character uppercase room code
  state: GameState;                      // Current game state
  language: 'en' | 'id';                 // Room language
  players: Player[];                     // Active players (max 10)
  spectators: Player[];                  // Players who joined during active game
  words: string[];                       // Word list for current game
  currentWordIndex: number;              // Current round (0-based)
  currentAnswers: Record<string, string>;// Player answers for current round
  lastActivity: number;                  // Timestamp for cleanup
}

enum GameState {
  LOBBY = 'LOBBY',      // Waiting for players / between games
  PLAYING = 'PLAYING',  // Game in progress
  ENDED = 'ENDED'       // Game finished, showing results
}
```

## Response Formats

### Success Response
Most events return the updated room state or a specific response object:

```typescript
// Create/Join Room Response
{
  room: Room,
  player: Player
}

// Check Room Response
{
  exists: boolean
}

// Reconnect Response (via 'reconnected' event)
{
  room: Room,
  player: Player
}
```

### Error Response
Errors are sent via the `error` event with this format:

```typescript
{
  message: string,        // Error description
  timestamp: string       // ISO 8601 timestamp
}
```

Common error messages:
- `"Room not found"` - Room ID doesn't exist
- `"Room is full"` - Maximum players reached (10)
- `"Only creator can start game"` - Non-creator tried to start
- `"Need at least 2 players to start"` - Not enough players
- `"Game not in progress"` - Tried to submit answer outside of game
- `"Player not found in any room"` - Reconnection failed

## DTO Validation

All client-to-server events are validated using DTOs:

### CreateRoomDto
```typescript
{
  playerName: string;    // @Length(1, 12)
  language: 'en' | 'id'; // @IsIn(['en', 'id'])
  playerId?: string;     // @IsOptional() @IsString()
}
```

### JoinRoomDto
```typescript
{
  roomId: string;       // @Length(4, 4)
  playerName: string;   // @Length(1, 12)
  playerId?: string;    // @IsString()
}
```

### SubmitAnswerDto
```typescript
{
  roomId: string;       // @IsNotEmpty()
  playerId: string;     // @IsNotEmpty()
  answer: string;       // @Length(1, 50)
}
```

### RoomActionDto (used by multiple events)
```typescript
{
  roomId: string;       // @IsNotEmpty()
  playerId: string;     // @IsNotEmpty()
}
```

## Health Check Endpoints

REST endpoints for monitoring:

### GET /health
Detailed health check with memory indicators.

**Response**:
```json
{
  "status": "ok",
  "info": {
    "memory_heap": { "status": "up" },
    "memory_rss": { "status": "up" }
  },
  "error": {},
  "details": {
    "memory_heap": { "status": "up" },
    "memory_rss": { "status": "up" }
  }
}
```

### GET /health/simple
Quick health check.

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2025-11-24T10:00:00.000Z",
  "uptime": 12345.67
}
```

## Connection Flow Examples

### Creating a Room
```typescript
// Client
socket.emit('createRoom', {
  playerName: 'Alice',
  language: 'en',
  playerId: localStorage.getItem('playerId') // Optional
}, (response) => {
  if (response.room) {
    // Success: response.room and response.player available
    console.log('Room created:', response.room.id);
  } else {
    // Error: response.error contains message
    console.error('Failed:', response.error);
  }
});

// Server broadcasts to all clients in room
socket.on('roomUpdate', (room) => {
  // Update UI with new room state
});
```

### Joining a Room
```typescript
// Client: Check if room exists first
socket.emit('checkRoom', { roomId: 'ABCD' }, (response) => {
  if (response.exists) {
    // Room exists, proceed to join
    socket.emit('joinRoom', {
      roomId: 'ABCD',
      playerName: 'Bob',
      playerId: localStorage.getItem('playerId')
    }, (response) => {
      if (response.room) {
        // Successfully joined
      } else {
        // Error (room full, etc.)
      }
    });
  } else {
    // Room doesn't exist
    showError('Room not found');
  }
});
```

### Reconnection
```typescript
// Client: On connection
socket.on('connect', () => {
  const playerId = localStorage.getItem('playerId');
  if (playerId) {
    socket.emit('reconnect', { playerId }, (response) => {
      if (response.error) {
        // Player not in any active room
      }
    });
  }
});

// Server response via 'reconnected' event
socket.on('reconnected', ({ room, player }) => {
  // Restore room and player state
  console.log('Reconnected to room:', room.id);
});
```

## Notes

- **Persistent Player IDs**: Players keep their UUID across sessions via localStorage
- **Automatic Reconnection**: Socket.io handles connection drops; use the `reconnect` event to restore game state
- **Room Cleanup**: Inactive rooms (15 min) are automatically deleted
- **Spectator Mode**: Players joining during an active game become spectators until the next round
- **Creator Powers**: Only the room creator can start games, kick players, and advance rounds
- **Validation**: All inputs are validated server-side; invalid requests return error responses
- **Redis Support**: Optional Redis integration for multi-server deployments (falls back to in-memory)

## Testing the API

You can test WebSocket events using tools like:
- [Socket.IO Client Tool](https://amritb.github.io/socketio-client-tool/)
- Postman (with WebSocket support)
- Custom test scripts with `socket.io-client`

Example test script:
```javascript
const io = require('socket.io-client');
const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('Connected:', socket.id);
  
  socket.emit('createRoom', {
    playerName: 'TestPlayer',
    language: 'en'
  }, (response) => {
    console.log('Room created:', response);
  });
});

socket.on('error', (error) => {
  console.error('Error:', error);
});
```
