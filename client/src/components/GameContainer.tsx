import { useEffect } from "react";
import { useGameStore } from "@/stores/gameStore";
import { useLanguageStore } from "@/stores/languageStore";
import { useNavigate, useParams } from "@/router";
import { GameRoom } from "./GameRoom";
import LandingPage from "./LandingPage";
import { Lobby } from "./Lobby";
import { JoinRoomPage } from "./JoinRoomPage";

const GameContainer = () => {
  const { room, player, isReconnecting } = useGameStore();
  const { t, language, setLanguage } = useLanguageStore();
  const navigate = useNavigate();
  const params = useParams("/room/:roomId");
  const roomId = params?.roomId;

  useEffect(() => {
    if (room && room.language !== language) {
      setLanguage(room.language);
    }
  }, [room, language, setLanguage]);

  useEffect(() => {
    if (room) {
      navigate("/room/:roomId", { params: { roomId: room.id } });
    }
  }, [room, navigate]);

  if (isReconnecting) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-indigo-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-400 rounded-full border-t-transparent animate-spin"></div>
          <p className="text-lg font-bold text-indigo-400 animate-pulse">
            {t.loading}
          </p>
        </div>
      </div>
    );
  }

  // If user visits /room/:roomId but isn't in a room, show join page
  if (!room || !player) {
    if (roomId) {
      return <JoinRoomPage roomId={roomId} />;
    }
    return <LandingPage />;
  }

  const showLobby =
    room.state === "LOBBY" || (room.state === "ENDED" && player.isReady);
  const showGameRoom =
    room.state === "PLAYING" || (room.state === "ENDED" && !player.isReady);

  return (
    <>
      {showLobby && <Lobby />}
      {showGameRoom && <GameRoom />}
    </>
  );
};

export default GameContainer;
