# Multiplayer Chemistry Game

A live multiplayer word-association game built with React and NestJS. Test your chemistry with friends by thinking alike!

## 🚀 Quick Start

### Prerequisites

- Node.js (v22+)
- npm

### Installation

1.  **Clone the repository**:

    ```bash
    git clone https://github.com/dev-dimas/chemistry-game.git
    cd chemistry-game
    ```

2.  **Install Server Dependencies**:

    ```bash
    cd server
    npm install
    ```

3.  **Configure Server Environment**:

    ```bash
    cd server
    cp .env.example .env
    # Edit .env file if you need to change the port or other settings
    ```

4.  **Install Client Dependencies**:

    ```bash
    cd ../client
    npm install
    ```

5.  **Configure Client Environment**:

    ```bash
    cd client
    cp .env.example .env
    # Edit .env file if you need to change the backend API URL
    ```

### Running the Application

1.  **Start the Server** (Default port: 3000):

    ```bash
    cd server
    npm run start:dev
    ```

2.  **Start the Client** (Runs on port 5173):

    ```bash
    cd client
    npm run dev
    ```

3.  Open `http://localhost:5173` in your browser.

### Optional: Redis Setup

For production deployments with multiple server instances:

```bash
# Install Redis
# Ubuntu/Debian: sudo apt-get install redis-server
# macOS: brew install redis

# Start Redis
redis-server

# Update server/.env
REDIS_URL=redis://localhost:6379
```

**Note**: Redis is optional. The server will use in-memory storage if not configured.

## 🎮 Game Rules

1.  **Create a Room**: Enter your name and start a room. Share the link or room code with friends.
2.  **Join**: Minimum 2 players required to start. Up to 10 players supported (configurable).
3.  **Play**:
    - A word appears (e.g., "Sun").
    - Everyone types the first word that comes to mind.
    - If everyone types the same word -> **CHEMISTRY!** (Everyone gets +1 point).
    - If answers don't match -> No points awarded.
4.  **Progress**:
    - Host clicks "Next Word" to proceed to the next round.
    - After the last round, results are shown automatically after 3 seconds.
5.  **Win**: Complete all rounds (default: 10) and compare your Chemistry Score!

## ✨ Features

### Game Features

- **Bilingual Support**: Full English and Indonesian translations
- **Real-time Multiplayer**: Socket.io powered instant synchronization
- **Reconnection**: Automatic reconnection if connection drops
- **Persistent Identity**: Keep your player identity across sessions
- **Spectator Mode**: Join ongoing games and play in the next round
- **Room Sharing**: Share room links with automatic join flow
- **Custom Alert UI**: Beautiful in-game alerts instead of browser popups
- **Responsive Design**: Works on desktop and mobile devices
- **Configurable Game Settings**: Customize rounds, player limits, and more

### Technical Features

- **Production Ready**: Comprehensive error handling and validation
- **Scalable**: Redis support for horizontal scaling
- **Health Monitoring**: Built-in health check endpoints
- **Type-Safe**: Full TypeScript with DTOs and validation
- **Well Tested**: 81% test coverage with 88 unit tests
- **Clean Architecture**: Separation of concerns with modules

## ⚙️ Configuration

You can customize game settings in `server/src/game/config/game.config.ts`:

```typescript
export const GameConfig = {
  WORDS_PER_GAME: 10, // Number of rounds per game
  MIN_PLAYERS: 2, // Minimum players to start
  MAX_PLAYERS: 10, // Maximum players per room
  ROOM_INACTIVITY_TIMEOUT: 15 * 60 * 1000, // 15 minutes
  CLEANUP_INTERVAL: 60 * 1000, // Check every 1 minute
};
```

See `server/src/game/config/README.md` for detailed configuration documentation.

## 🛠 Tech Stack

### Frontend

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 3
- **Routing**: @generouted/react-router (file-based routing)
- **State Management**: Zustand (replaced React Context)
- **Real-time**: Socket.io-client 4
- **UI Components**: Custom component library

### Backend

- **Framework**: NestJS 11 + TypeScript
- **Real-time**: Socket.io 4 (WebSockets)
- **Validation**: class-validator + class-transformer
- **Health Checks**: @nestjs/terminus
- **Persistence**: Redis (optional, with in-memory fallback)
- **Testing**: Jest (81% coverage, 88 tests)

## 📂 Project Structure

```
chemistry-game/
├── server/                    # NestJS backend
│   ├── src/
│   │   ├── filters/          # Exception filters
│   │   │   └── ws-exception.filter.ts
│   │   ├── game/             # Game module
│   │   │   ├── config/       # Game configuration
│   │   │   ├── constants/    # Word lists (EN/ID)
│   │   │   ├── dto/          # Data Transfer Objects with validation
│   │   │   ├── interfaces/   # TypeScript interfaces
│   │   │   ├── game.gateway.ts   # WebSocket event handlers
│   │   │   └── game.service.ts   # Game business logic
│   │   ├── health/           # Health check endpoints
│   │   │   └── health.controller.ts
│   │   ├── redis/            # Redis integration (optional)
│   │   │   └── redis.service.ts
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── test/                 # E2E tests
│   └── package.json
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/       # UI components
│   │   │   ├── Alert.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── GameContainer.tsx
│   │   │   ├── GameRoom.tsx
│   │   │   ├── JoinRoomPage.tsx  # NEW: Room join page
│   │   │   ├── LandingPage.tsx
│   │   │   └── Lobby.tsx
│   │   ├── pages/            # File-based routes (@generouted)
│   │   │   ├── index.tsx     # / route
│   │   │   ├── 404.tsx       # Global 404 page
│   │   │   └── room/
│   │   │       ├── [roomId].tsx  # /room/:roomId route
│   │   │       └── index.tsx    # Not found page
│   │   ├── stores/           # Zustand state management
│   │   │   ├── gameStore.ts
│   │   │   ├── languageStore.ts
│   │   │   └── alertStore.ts
│   │   ├── i18n/             # Internationalization
│   │   │   └── translations.ts
│   │   └── App.tsx
│   └── package.json
├── docs/                      # Documentation
│   ├── api.md                # WebSocket API reference
│   └── spec.md               # Game specification
└── README.md
```

## 🌐 Language Support

The game supports two languages:

- **English (EN)**
- **Indonesian (ID)**

Language is set by the room creator and synchronized across all players. Toggle the language on the landing page before creating a room.

## 📖 Documentation

### Game Documentation

- [Game Specification](./docs/spec.md) - Detailed game design and requirements
- [WebSocket API](./docs/api.md) - Complete API reference
- [Game Configuration](./server/src/game/config/README.md) - Customization guide

### Technical Documentation

- [Testing Guide](./server/README.md#testing) - How to run tests

## 🧪 Testing

### Server Tests

```bash
cd server
npm test              # Run all tests
npm run test:cov      # Run with coverage report
npm run test:watch    # Run in watch mode
```

**Current Coverage**: 96.62% (122 tests passing)

### Client Tests

```bash
cd client
npm test
```

## 🏥 Health Monitoring

The server includes health check endpoints for monitoring:

- `GET /health` - Detailed health check with memory indicators
- `GET /health/simple` - Quick uptime check

Example response:

```json
{
  "status": "ok",
  "timestamp": "2025-11-24T10:00:00.000Z",
  "uptime": 12345.67
}
```

## 🔧 Development

### Build for Production

**Server**:

```bash
cd server
npm run build
npm run start:prod
```

**Client**:

```bash
cd client
npm run build
npm run preview
```

### Linting

**Server**:

```bash
cd server
npm run lint        # Auto-fix issues
```

**Client**:

```bash
cd client
npm run lint
```

## 🚢 Deployment

### Environment Variables

**Server** (`server/.env`):

```bash
PORT=3000
NODE_ENV=production
CLIENT_URL=https://your-frontend-domain.com
REDIS_URL=redis://your-redis-host:6379  # Optional
```

**Client** (`client/.env`):

```bash
VITE_API_URL=https://your-backend-domain.com
```

### Docker Support (Coming Soon)

Docker configuration files are planned for easy containerized deployment.

## 🛣️ Roadmap

### Planned Features

- [ ] Docker and Docker Compose setup
- [ ] Rate limiting with @nestjs/throttler
- [ ] Structured logging with Winston
- [ ] Prometheus metrics for monitoring
- [ ] JWT authentication for WebSockets
- [ ] Game history and statistics
- [ ] Admin dashboard for room management
- [ ] Room password protection
- [ ] Custom word lists per room

## 📊 Architecture

### State Management Flow (Frontend)

```
User Action → Zustand Store → Socket.io Event → Server
                ↓                                  ↓
            UI Update ← Socket.io Event ← Room Update
```

### Backend Architecture

```
WebSocket Event → Gateway (Validation) → Service (Business Logic)
                     ↓                          ↓
              Exception Filter         Redis/In-Memory Storage
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is open source and available under the [MIT License](./LICENSE).

Copyright (c) 2025 Dimas Octa Maulana
