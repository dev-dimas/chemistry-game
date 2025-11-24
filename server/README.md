# Chemistry Game - Server

NestJS backend for the Chemistry Game multiplayer application.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Run in development mode
npm run start:dev

# Run in production mode
npm run build
npm run start:prod
```

## 📋 Environment Variables

Create a `.env` file in the server directory:

```bash
# Server Configuration
PORT=3000

# Application
NODE_ENV=development

# Client URL for CORS
CLIENT_URL=http://localhost:5173

# Redis Configuration (optional - if not set, uses in-memory storage)
# REDIS_URL=redis://localhost:6379
```

## 🏗️ Architecture

### Module Structure

```
src/
├── filters/              # Exception filters
│   └── ws-exception.filter.ts
├── game/                 # Game module
│   ├── config/          # Configuration
│   ├── constants/       # Word lists
│   ├── dto/             # Data Transfer Objects
│   ├── interfaces/      # TypeScript interfaces
│   ├── game.gateway.ts  # WebSocket handlers
│   ├── game.service.ts  # Business logic
│   └── game.module.ts
├── health/              # Health check endpoints
│   ├── health.controller.ts
│   └── health.module.ts
├── redis/               # Redis integration (optional)
│   ├── redis.service.ts
│   └── redis.module.ts
├── app.module.ts
└── main.ts
```

### Key Features

- ✅ **DTO Validation**: All inputs validated with `class-validator`
- ✅ **Redis Support**: Optional persistence layer with in-memory fallback
- ✅ **Exception Filters**: Graceful error handling for WebSockets
- ✅ **Health Checks**: Monitoring endpoints for infrastructure
- ✅ **Type Safety**: Full TypeScript with strict typing
- ✅ **Test Coverage**: 96.62% coverage with 122 unit tests

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:cov

# Run tests in watch mode
npm run test:watch

# Run e2e tests
npm run test:e2e
```

### Current Test Coverage

```
File                     | % Stmts | % Branch | % Funcs | % Lines
-------------------------|---------|----------|---------|--------
All files                | 96.62   | 82.55    | 93.90   | 97.55
 src                     | 100     | 100      | 100     | 100
  app.controller.ts      | 100     | 100      | 100     | 100
 src/filters             | 100     | 100      | 100     | 100
  ws-exception.filter.ts | 100     | 100      | 100     | 100
 src/game                | 95.72   | 80.82    | 92.06   | 97.13
  game.gateway.ts        | 100     | 77.9     | 100     | 100
  game.service.ts        | 93.97   | 83.17    | 89.79   | 95.83
 src/game/dto            | 100     | 100      | 100     | 100
 src/health              | 100     | 75       | 100     | 100
  health.controller.ts   | 100     | 75       | 100     | 100
 src/redis               | 97.29   | 92.85    | 100     | 96.96
  redis.service.ts       | 97.29   | 92.85    | 100     | 96.96
-------------------------|---------|----------|---------|--------
```

**Total**: 122 tests passing across 10 test suites

### Test Coverage Breakdown

- **game.service.spec.ts**: 56 tests - Core game logic and room management
- **game.gateway.spec.ts**: 37 tests - WebSocket event handlers
- **redis.service.integration.spec.ts**: 49 tests - Redis integration
- **game.service.additional.spec.ts**: 6 tests - Spectator scenarios
- **game.gateway.additional.spec.ts**: 3 tests - Additional gateway coverage
- **game.service.with-redis.spec.ts**: 5 tests - Redis-connected paths
- **health.controller.spec.ts**: 3 tests - Health endpoints
- **ws-exception.filter.spec.ts**: 2 tests - Exception handling
- **redis.service.spec.ts**: 10 tests - Redis fallback mode
- **app.controller.spec.ts**: 1 test - Root controller

See [TEST_COVERAGE_REPORT.md](./TEST_COVERAGE_REPORT.md) for detailed coverage analysis.

## 🔧 Development

### Available Scripts

```bash
npm run start          # Start server
npm run start:dev      # Start with hot reload
npm run start:debug    # Start with debugging
npm run start:prod     # Start production build

npm run build          # Build for production
npm run format         # Format code with Prettier
npm run lint           # Lint and auto-fix with ESLint
```

### Code Quality

```bash
# Lint check
npm run lint

# Build check
npm run build
```

Current status:
- ✅ Build: Passing
- ✅ Lint: Passing (0 errors, warnings only)
- ✅ Tests: 122/122 passing
- ✅ Coverage: 96.62% (Excellent)

## 📖 API Documentation

See [/docs/api.md](../docs/api.md) for complete WebSocket API reference.

### Health Check Endpoints

```bash
# Detailed health check
GET http://localhost:3000/health

# Simple uptime check
GET http://localhost:3000/health/simple
```

## ⚙️ Configuration

### Game Settings

Edit `src/game/config/game.config.ts`:

```typescript
export const GameConfig = {
  WORDS_PER_GAME: 10,              // Rounds per game
  MIN_PLAYERS: 2,                  // Min players to start
  MAX_PLAYERS: 10,                 // Max players per room
  ROOM_INACTIVITY_TIMEOUT: 900000, // 15 minutes
  CLEANUP_INTERVAL: 60000,         // 1 minute
};
```

### Redis Setup (Optional)

Redis enables:
- Room persistence across restarts
- Horizontal scaling with multiple servers
- Better performance for high traffic

```bash
# Install Redis
# Ubuntu/Debian
sudo apt-get install redis-server

# macOS
brew install redis

# Start Redis
redis-server

# Update .env
REDIS_URL=redis://localhost:6379
```

**Note**: Server works without Redis using in-memory storage.

## 🏥 Monitoring

### Health Check Response

```json
{
  "status": "ok",
  "info": {
    "memory_heap": { "status": "up" },
    "memory_rss": { "status": "up" }
  }
}
```

### Simple Health Check

```json
{
  "status": "ok",
  "timestamp": "2025-11-24T10:00:00.000Z",
  "uptime": 12345.67
}
```

## 🚢 Deployment

### Production Build

```bash
npm run build
npm run start:prod
```

### Environment Variables

Production `.env`:

```bash
PORT=3000
NODE_ENV=production
CLIENT_URL=https://your-frontend-domain.com
REDIS_URL=redis://your-redis-host:6379
```

### Docker (Coming Soon)

Docker configuration planned for easy containerized deployment.

## 🛠️ Technologies

- **NestJS 11**: Progressive Node.js framework
- **Socket.io 4**: Real-time WebSocket communication
- **class-validator**: DTO validation
- **class-transformer**: Object transformation
- **@nestjs/terminus**: Health checks
- **ioredis**: Optional Redis client
- **Jest**: Testing framework

## 📚 Additional Documentation

- [Server Improvements](./IMPROVEMENTS.md) - Detailed changelog
- [Game Specification](../docs/spec.md) - Game rules and design
- [WebSocket API](../docs/api.md) - Complete API reference
- [Room Join Flow](../ROOM_JOIN_FLOW.md) - Room sharing UX

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Write tests for new features
4. Ensure all tests pass: `npm test`
5. Ensure linting passes: `npm run lint`
6. Submit a pull request

## 📝 License

MIT License - see [LICENSE](../LICENSE) file for details.

---

**Status**: Production Ready ✅  
**Test Coverage**: 96.62% (122 tests) 🎯  
**Build**: Passing  
**Lint**: Passing
