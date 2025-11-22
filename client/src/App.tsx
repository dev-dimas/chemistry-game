import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { GameProvider, useGame } from './context/GameContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AlertProvider } from './context/AlertContext';
import { LandingPage } from './pages/LandingPage';
import { Lobby } from './pages/Lobby';
import { GameRoom } from './pages/GameRoom';
import { JoinRoomPage } from './pages/JoinRoomPage';

const GameContainer = () => {
  const { room, player, isReconnecting } = useGame();
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const { roomId } = useParams();

  // Handle Language Sync
  useEffect(() => {
      if (room && room.language !== language) {
          setLanguage(room.language);
      }
  }, [room, language, setLanguage]);
  useEffect(() => {
      if (room) {
          navigate(`/room/${room.id}`);
      }
  }, [room, navigate]);

  if (isReconnecting) {
      return (
          <div className="min-h-screen bg-indigo-900 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-indigo-400 font-bold text-lg animate-pulse">{t.loading}</p>
              </div>
          </div>
      );
  }

  if (!room || !player) {
      if (roomId) {
          return <JoinRoomPage />;
      }
      return <LandingPage />;
  }

  // Determine which screen to show based on room state and player readiness
  const showLobby = room.state === 'LOBBY' || (room.state === 'ENDED' && player.isReady);
  const showGameRoom = room.state === 'PLAYING' || (room.state === 'ENDED' && !player.isReady);

  return (
      <>
          {showLobby && <Lobby />}
          {showGameRoom && <GameRoom />}
      </>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AlertProvider>
        <GameProvider>
          <Router>
            <Routes>
                <Route path="/" element={<GameContainer />} />
                <Route path="/room/:roomId" element={<GameContainer />} />
            </Routes>
          </Router>
        </GameProvider>
      </AlertProvider>
    </LanguageProvider>
  );
}

export default App;
