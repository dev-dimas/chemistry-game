import React, { useState } from "react";
import { useGame } from "../context/GameContext";
import { useLanguage } from "../context/LanguageContext";
import { useAlert } from "../context/AlertContext";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { HowToPlayModal } from "../components/HowToPlayModal";
import { FlaskIcon, AtomIcon, ChemistryIcon } from "../components/Icons";

export const LandingPage: React.FC = () => {
  const { createRoom, joinRoom } = useGame();
  const { t, language, setLanguage } = useLanguage();
  const { showAlert } = useAlert();
  const [name, setName] = useState("");
  const [roomIdToJoin, setRoomIdToJoin] = useState("");
  const [showRules, setShowRules] = useState(false);

  const handleCreate = () => {
    if (!name.trim()) {
      showAlert(t.enterName);
      return;
    }
    createRoom(name, language);
  };

  const handleJoin = () => {
    if (!name.trim()) {
      showAlert(t.enterName);
      return;
    }
    if (!roomIdToJoin.trim()) {
      showAlert(t.enterRoomId);
      return;
    }
    joinRoom(roomIdToJoin, name);
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen p-4 overflow-hidden bg-blue-50">
      {/* Background Blobs */}
      <div className="absolute top-10 left-10 text-blue-200 opacity-50 animate-bounce duration-[3000ms]">
        <FlaskIcon className="w-24 h-24" />
      </div>
      <div className="absolute bottom-10 right-10 text-yellow-200 opacity-50 animate-pulse duration-[4000ms]">
        <AtomIcon className="w-32 h-32" />
      </div>
      <div className="absolute text-green-200 rotate-45 top-20 right-20 opacity-30">
        <ChemistryIcon className="w-20 h-20" />
      </div>

      <div className="bg-white p-8 rounded-[40px] shadow-2xl max-w-md w-full flex flex-col gap-8 text-center border-8 border-blue-100 relative z-10">
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center justify-center w-20 h-20 mb-2 transition-transform transform bg-blue-500 shadow-lg rounded-3xl rotate-3 hover:rotate-0">
            <span className="text-5xl">🧪</span>
          </div>
          <h1 className="text-5xl font-black tracking-tight text-blue-600">
            {t.title}
          </h1>
          <p className="text-lg font-medium text-gray-400">{t.subtitle}</p>
          {/* Language Toggle */}
          <div className="flex justify-center w-full gap-2 bg-white rounded-full shadow-sm top-4 right-4">
            <button
              onClick={() => setLanguage("en")}
              className={`px-3 py-1 rounded-full text-sm font-bold transition-colors ${
                language === "en"
                  ? "bg-blue-500 text-white"
                  : "text-gray-400 hover:bg-gray-100"
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage("id")}
              className={`px-3 py-1 rounded-full text-sm font-bold transition-colors ${
                language === "id"
                  ? "bg-blue-500 text-white"
                  : "text-gray-400 hover:bg-gray-100"
              }`}
            >
              ID
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <Input
            label={t.yourName}
            placeholder="e.g. Einstein"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={12}
          />
        </div>

        <div className="grid gap-4">
          <Button
            onClick={handleCreate}
            className="w-full transform hover:-translate-y-1"
          >
            {t.createRoom}
          </Button>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-gray-100"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 font-bold text-gray-400 bg-white">
                {t.or}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder={t.roomCode}
              value={roomIdToJoin}
              onChange={(e) => setRoomIdToJoin(e.target.value.toUpperCase())}
              maxLength={4}
              className="tracking-widest text-center uppercase"
            />
            <Button variant="secondary" onClick={handleJoin}>
              {t.join}
            </Button>
          </div>
        </div>

        <button
          onClick={() => setShowRules(true)}
          className="mt-2 font-bold text-blue-400 underline hover:text-blue-600"
        >
          {t.howToPlay}
        </button>
      </div>

      <HowToPlayModal isOpen={showRules} onClose={() => setShowRules(false)} />
    </div>
  );
};
