# Chemistry Game - Client

React frontend client for the Multiplayer Chemistry Game.

## Overview

This is the frontend client built with React, TypeScript, and Tailwind CSS that provides:

- Interactive game interface
- Real-time multiplayer synchronization
- Bilingual support (English/Indonesian)
- Custom alert UI
- Responsive design for desktop and mobile

## Setup

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Run in development mode**:

   ```bash
   npm run dev
   ```

3. **Build for production**:

   ```bash
   npm run build
   ```

4. **Preview production build**:
   ```bash
   npm run preview
   ```

The client will run on `http://localhost:5173` by default.

## Project Structure

```
client/
├── src/
│   ├── components/      # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Toast.tsx
│   │   ├── HowToPlayModal.tsx
│   │   └── Icons.tsx
│   ├── context/         # React Context providers
│   │   ├── GameContext.tsx      # Game state & Socket.io
│   │   ├── LanguageContext.tsx  # Translation system
│   │   └── AlertContext.tsx     # Custom alerts
│   ├── i18n/            # Translation files
│   │   └── translations.ts
│   ├── pages/           # Page components
│   │   ├── LandingPage.tsx
│   │   ├── JoinRoomPage.tsx
│   │   ├── Lobby.tsx
│   │   └── GameRoom.tsx
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/
└── package.json
```

## Features

- **Bilingual Support**: Full English and Indonesian translations
- **Real-time Updates**: Instant synchronization with Socket.io
- **Custom Alert UI**: Beautiful modal alerts instead of browser popups
- **Responsive Design**: Works on desktop and mobile devices
- **Persistent Identity**: Player ID stored in localStorage
- **Auto-reconnection**: Reconnects automatically if connection drops
- **State Synchronization**: Player state syncs with room updates

## Language Support

The app supports two languages:

- **English (EN)**
- **Indonesian (ID)**

Language is set by the room creator on the landing page and synchronized across all players.

### Adding New Translations

1. Open `src/i18n/translations.ts`
2. Add new keys to both `en` and `id` objects:

```typescript
export const translations = {
  en: {
    newKey: "English text",
    // ...
  },
  id: {
    newKey: "Teks Indonesia",
    // ...
  },
};
```

3. Use in components:

```typescript
const { t } = useLanguage();
return <div>{t.newKey}</div>;
```

## State Management

The app uses React Context API for state management:

### GameContext

- Manages Socket.io connection
- Handles game state (room, player, etc.)
- Provides game actions (createRoom, joinRoom, etc.)

### LanguageContext

- Manages language selection
- Provides translation function `t`
- Syncs language with room settings

### AlertContext

- Provides custom alert UI
- Replaces browser `alert()` calls
- Supports title and message customization

## Components

### Button

Reusable button component with variants:

- `primary` (default)
- `secondary`
- `danger`

### Input

Reusable input field with label support.

### Toast

Toast notification for temporary messages.

### HowToPlayModal

Modal displaying game rules and instructions.

## Tech Stack

- **Framework**: React + Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **WebSocket**: Socket.io-client
- **Routing**: React Router
- **State**: React Context API

## Development

```bash
# Development server with hot reload
npm run dev

# Type checking
npm run type-check

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Environment Variables

The app connects to the server at `http://localhost:3000` by default. To change this, update the socket connection in `src/context/GameContext.tsx`:

```typescript
const newSocket = io("http://your-server-url:port");
```

## License

This project is licensed under the [MIT License](../LICENSE).

Copyright (c) 2025 Dimas Octa Maulana
