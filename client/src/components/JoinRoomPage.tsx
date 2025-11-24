import React, { useState, useEffect } from "react";
import { useGameStore } from "../stores/gameStore";
import { useLanguageStore } from "../stores/languageStore";
import { useAlertStore } from "../stores/alertStore";
import { useNavigate } from "../router";
import { Button } from "./Button";
import { Input } from "./Input";
import { BackgroundPattern } from "./BackgroundPattern";

interface JoinRoomPageProps {
  roomId: string;
}

export const JoinRoomPage: React.FC<JoinRoomPageProps> = ({ roomId }) => {
  const { joinRoom, socket } = useGameStore();
  const { t } = useLanguageStore();
  const { showAlert } = useAlertStore();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [isChecking, setIsChecking] = useState(true);
  const [roomExists, setRoomExists] = useState(false);

  useEffect(() => {
    // Check if room exists by attempting to query it via socket
    if (!socket) return;

    const checkRoom = () => {
      // Emit a custom event to check room existence
      socket.emit("checkRoom", { roomId }, (response: { exists: boolean }) => {
        setRoomExists(response.exists);
        setIsChecking(false);
      });
    };

    // Small delay to ensure socket is connected
    const timer = setTimeout(checkRoom, 500);
    return () => clearTimeout(timer);
  }, [socket, roomId, navigate, showAlert, t]);

  const handleJoin = () => {
    if (!name.trim()) {
      showAlert(t.enterName);
      return;
    }
    joinRoom(roomId, name);
  };

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-indigo-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-400 rounded-full border-t-transparent animate-spin"></div>
          <p className="text-lg font-bold text-indigo-400 animate-pulse">
            {t.loading || "Checking room..."}
          </p>
        </div>
      </div>
    );
  }

  if (!roomExists) {
    return (
      <div className="relative flex flex-col items-center justify-center min-h-screen p-4 overflow-hidden bg-indigo-900">
        <BackgroundPattern />
        <div className="bg-white p-8 rounded-[40px] shadow-2xl max-w-md w-full text-center border-8 border-red-100">
          <div className="mb-4 text-6xl text-red-500">❌</div>
          <h1 className="mb-2 text-3xl font-black text-red-600">
            {t.roomNotFound || "Room Not Found"}
          </h1>
          <p className="mb-6 text-gray-600">
            {t.roomNotFoundDesc ||
              "This room doesn't exist or has been closed."}
          </p>
          <Button onClick={() => navigate("/")} className="w-full">
            {t.backToHome || "Back to Home"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen p-4 overflow-hidden bg-indigo-900">
      <BackgroundPattern />

      <div className="bg-white p-8 rounded-[40px] shadow-2xl max-w-md w-full flex flex-col gap-8 text-center border-8 border-blue-100 relative z-10">
        <div className="flex flex-col items-center gap-2">
          <img
            src="/android-chrome-512x512.png"
            alt="Chemistry Game Logo"
            className="w-20 h-20"
          />
          <h1 className="text-4xl font-black tracking-tight text-blue-600">
            {t.joinRoom || "Join Room"}
          </h1>
          <div className="flex items-center gap-2 px-4 py-2 bg-indigo-100 rounded-xl">
            <span className="text-sm font-bold text-gray-500">
              {t.roomCode || "Room Code"}:
            </span>
            <span className="text-2xl font-black tracking-widest text-indigo-600">
              {roomId}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <Input
            label={t.yourName}
            placeholder="e.g. Einstein"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            maxLength={12}
            autoFocus
          />
        </div>

        <div className="grid gap-4">
          <Button
            onClick={handleJoin}
            className="w-full transform hover:-translate-y-1"
          >
            {t.join || "Join Room"}
          </Button>

          <button
            onClick={() => navigate("/")}
            className="text-sm font-bold text-gray-400 transition-colors hover:text-gray-600"
          >
            {t.backToHome || "Back to Home"}
          </button>
        </div>
      </div>
    </div>
  );
};
