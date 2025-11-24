# Chemistry Game - Client

React frontend for the Chemistry Game multiplayer application.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Run development server
npm run dev

# Build for production
npm run build
npm run preview
```

## 📋 Environment Variables

Create a `.env` file in the client directory:

```bash
# Backend API URL
VITE_API_URL=http://localhost:3000
```

## 🏗️ Architecture

### Folder Structure

```
src/
├── components/           # React components
│   ├── Alert.tsx        # Alert modal component
│   ├── Button.tsx       # Reusable button component
│   ├── GameContainer.tsx # Main game container
│   ├── GameRoom.tsx     # Active game screen
│   ├── JoinRoomPage.tsx # Room joining page
│   ├── LandingPage.tsx  # Home page
│   ├── Lobby.tsx        # Waiting room
│   └── ...
├── pages/               # File-based routes (@generouted)
│   ├── index.tsx        # / route
│   └── room/
│       └── [roomId].tsx # /room/:roomId route
├── stores/              # Zustand state management
│   ├── gameStore.ts     # Game state and socket logic
│   ├── languageStore.ts # Language/i18n state
│   └── alertStore.ts    # Alert modal state
├── i18n/                # Internationalization
│   └── translations.ts  # EN/ID translations
├── router.ts            # Generated routes (auto)
└── App.tsx              # Root component
```

### State Management

Uses **Zustand** for simple, scalable state management:

```typescript
// Game Store
const { room, player, createRoom, joinRoom } = useGameStore();

// Language Store
const { t, language, setLanguage } = useLanguageStore();

// Alert Store
const { showAlert, closeAlert } = useAlertStore();
```

### Routing

Uses **@generouted/react-router** for file-based routing:

- `pages/index.tsx` → `/`
- `pages/room/[roomId].tsx` → `/room/:roomId`

Routes are automatically generated based on file structure.

## 🎨 Styling

- **Tailwind CSS 3**: Utility-first CSS framework
- **Custom Components**: Reusable UI components with consistent styling
- **Responsive Design**: Mobile-friendly layouts
- **Dark Theme**: Indigo color scheme

## 🌐 Internationalization

Supports English (EN) and Indonesian (ID):

```typescript
// translations.ts
export const translations = {
  en: {
    title: "Chemistry",
    createRoom: "Create Room",
    // ...
  },
  id: {
    title: "Chemistry",
    createRoom: "Buat Room",
    // ...
  }
};
```

Usage:
```typescript
const { t, setLanguage } = useLanguageStore();

<h1>{t.title}</h1>
<button onClick={() => setLanguage('id')}>
  Switch to Indonesian
</button>
```

## 🔌 WebSocket Integration

Socket.io client integrated in `gameStore.ts`:

```typescript
// Initialize socket connection
const initializeSocket = useGameStore(state => state.initializeSocket);

useEffect(() => {
  initializeSocket(); // Connect on mount
}, []);

// Use game actions
const { createRoom, joinRoom, startGame } = useGameStore();

createRoom('Alice', 'en'); // Create room
joinRoom('ABCD', 'Bob');   // Join room
```

## 🧩 Key Features

### Room Joining Flow
1. User visits `/room/ABCD`
2. `checkRoom` event verifies room exists
3. If exists: Show join form
4. If not: Show error + redirect

### Automatic Reconnection
- Player IDs stored in localStorage
- Automatic reconnection on page refresh
- State restored from server

### Loading States
- Reconnection spinner
- Room checking spinner
- Button loading states

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 🔧 Development

### Available Scripts

```bash
npm run dev        # Start dev server (port 5173)
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Lint and auto-fix with ESLint
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
- ✅ TypeScript: Strict mode
- ✅ Lint: Passing

## 📱 Components

### Core Components

**GameContainer**: Main routing logic
- Handles reconnection state
- Routes to correct screen based on game state
- Shows join page for room links

**LandingPage**: Home screen
- Create room
- Join room with code
- Language selection
- How to play modal

**JoinRoomPage**: Room joining
- Validates room existence
- Shows room code
- Name input
- Error handling

**Lobby**: Waiting room
- Player list
- Start game (host only)
- Invite link copy
- Kick players (host only)

**GameRoom**: Active game
- Current word display
- Answer input
- Round results
- Score display
- Next round button (host only)

### UI Components

**Button**: Reusable button with variants
```typescript
<Button variant="primary" onClick={handleClick}>
  Click Me
</Button>
```

**Input**: Form input with label
```typescript
<Input
  label="Your Name"
  value={name}
  onChange={(e) => setName(e.target.value)}
  maxLength={12}
/>
```

**Alert**: Modal alert system
```typescript
const { showAlert } = useAlertStore();

showAlert('Room not found', 'Error');
```

## 🎮 Game Flow

```
Landing Page
    ↓
Create Room / Join Room / Visit Link
    ↓
Lobby (Wait for players)
    ↓
Game Room (Play rounds)
    ↓
Game Over (Show results)
    ↓
Back to Lobby
```

## 🚢 Deployment

### Build for Production

```bash
npm run build
```

Output: `dist/` directory

### Environment Variables

Production `.env`:

```bash
VITE_API_URL=https://your-backend-domain.com
```

### Static Hosting

Compatible with:
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront
- Any static hosting service

### SPA Configuration

Make sure to configure your host for SPA routing:

**Vercel** (`vercel.json`):
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

**Netlify** (`_redirects`):
```
/*  /index.html  200
```

## 🛠️ Technologies

- **React 19**: Latest React with concurrent features
- **TypeScript**: Type-safe development
- **Vite 7**: Fast build tool and dev server
- **Tailwind CSS 3**: Utility-first styling
- **Zustand**: Lightweight state management
- **@generouted/react-router**: File-based routing
- **Socket.io-client 4**: Real-time WebSocket
- **class-validator**: Client-side validation

## 📚 Additional Documentation

- [WebSocket API](../docs/api.md) - Complete API reference
- [Game Specification](../docs/spec.md) - Game rules and design
- [Room Join Flow](../ROOM_JOIN_FLOW.md) - Room sharing UX

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Ensure build passes: `npm run build`
4. Ensure linting passes: `npm run lint`
5. Submit a pull request

## 📝 License

MIT License - see [LICENSE](../LICENSE) file for details.

---

**Status**: Production Ready ✅  
**Build**: Passing  
**Lint**: Passing  
**Framework**: React 19 + Vite 7
