# Chemistry Game - Server

NestJS backend server for the Multiplayer Chemistry Game.

## Overview

This is the backend server built with NestJS and Socket.io that handles:

- Real-time WebSocket communication
- Game state management
- Room creation and management
- Player authentication and reconnection
- Game logic and scoring

## Setup

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Run in development mode**:

   ```bash
   npm run start:dev
   ```

3. **Build for production**:

   ```bash
   npm run build
   ```

4. **Run production build**:
   ```bash
   npm run start:prod
   ```

The server will run on `http://localhost:3000` by default.

## Configuration

Game settings can be customized in `src/game/config/game.config.ts`:

```typescript
export const GameConfig = {
  WORDS_PER_GAME: 10, // Number of rounds per game
  MIN_PLAYERS: 2, // Minimum players to start
  MAX_PLAYERS: 10, // Maximum players per room
  ROOM_INACTIVITY_TIMEOUT: 15 * 60 * 1000, // 15 minutes
  CLEANUP_INTERVAL: 60 * 1000, // 1 minute
};
```

See `src/game/config/README.md` for detailed documentation.

## Project Structure

```
server/
├── src/
│   ├── game/
│   │   ├── config/         # Game configuration
│   │   ├── constants/      # Word lists (EN/ID)
│   │   ├── interfaces/     # TypeScript interfaces
│   │   ├── game.gateway.ts # WebSocket event handler
│   │   ├── game.service.ts # Game logic
│   │   └── game.module.ts
│   ├── app.module.ts
│   └── main.ts
├── dist/                   # Compiled output
└── package.json
```

## WebSocket Events

### Client → Server

- `createRoom`: Create a new room
- `joinRoom`: Join an existing room
- `reconnect`: Reconnect to a room
- `startGame`: Start the game (host only)
- `submitAnswer`: Submit an answer for current word
- `nextRound`: Advance to next round (host only)
- `playerReady`: Mark player as ready
- `kickPlayer`: Kick a player (host only)
- `leaveRoom`: Leave the room

### Server → Client

- `roomUpdate`: Room state changed
- `gameStarted`: Game has started
- `roundResult`: Round results available
- `nextRound`: Moving to next round
- `gameOver`: Game has ended
- `reconnected`: Successfully reconnected
- `playerKicked`: Player was kicked
- `roomDestroyed`: Room was destroyed
- `error`: Error occurred

## Features

- **Real-time Multiplayer**: Socket.io powered instant synchronization
- **Persistent Player Identity**: UUIDs stored in localStorage
- **Auto-reconnection**: Automatic state restoration on reconnect
- **Inactivity Cleanup**: Automatic room cleanup after timeout
- **Configurable Settings**: Easy customization via config file
- **Bilingual Support**: Word lists for English and Indonesian

## Tech Stack

- **Framework**: NestJS
- **WebSocket**: Socket.io
- **Language**: TypeScript
- **State Management**: In-memory (Map)

## Development

```bash
# Watch mode with auto-reload
npm run start:dev

# Build
npm run build

# Run tests
npm run test

# Lint code
npm run lint
```

## License

This project is licensed under the [MIT License](../LICENSE).

Copyright (c) 2025 Dimas Octa Maulana
