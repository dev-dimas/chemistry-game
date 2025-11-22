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

3.  **Install Client Dependencies**:
    ```bash
    cd ../client
    npm install
    ```

### Running the Application

1.  **Start the Server** (Runs on port 3000):

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

- **Bilingual Support**: Full English and Indonesian translations
- **Real-time Multiplayer**: Socket.io powered instant synchronization
- **Reconnection**: Automatic reconnection if connection drops
- **Persistent Identity**: Keep your player identity across sessions
- **Spectator Mode**: Join ongoing games and play in the next round
- **Custom Alert UI**: Beautiful in-game alerts instead of browser popups
- **Responsive Design**: Works on desktop and mobile devices
- **Configurable Game Settings**: Customize rounds, player limits, and more

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

- **Frontend**: React, TypeScript, Tailwind CSS, Vite, Socket.io-client
- **Backend**: NestJS, TypeScript, Socket.io
- **State Management**: React Context API
- **Real-time Communication**: WebSockets (Socket.io)

## 📂 Project Structure

```
chemistry-game/
├── server/           # NestJS backend
│   ├── src/
│   │   ├── game/
│   │   │   ├── config/      # Game configuration
│   │   │   ├── constants/   # Word lists (EN/ID)
│   │   │   ├── interfaces/  # TypeScript interfaces
│   │   │   ├── game.gateway.ts   # WebSocket handler
│   │   │   └── game.service.ts   # Game logic
│   │   └── main.ts
│   └── package.json
├── client/           # React frontend
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── context/      # React Context (Game, Language, Alert)
│   │   ├── i18n/         # Translation files
│   │   ├── pages/        # Main page components
│   │   └── App.tsx
│   └── package.json
├── docs/             # Project documentation
└── README.md
```

## 🌐 Language Support

The game supports two languages:

- **English (EN)**
- **Indonesian (ID)**

Language is set by the room creator and synchronized across all players. Toggle the language on the landing page before creating a room.

## 🔄 Recent Updates

- ✅ Auto-show game results after last round (no button click needed)
- ✅ Fixed player state synchronization for correct screen routing
- ✅ Custom alert UI (replaced all browser alerts)
- ✅ Complete bilingual support (all text translated)
- ✅ Immediate lobby display when clicking "Back to Lobby"
- ✅ Configurable game settings via config file
- ✅ Real-time updates for all game actions

## 📖 Documentation

- [Game Specification](./docs/spec.md) - Detailed game design and requirements
- [API Documentation](./docs/api.md) - WebSocket API reference
- [Game Configuration](./server/src/game/config/README.md) - How to customize game settings

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is open source and available under the [MIT License](./LICENSE).

Copyright (c) 2025 Dimas Octa Maulana
