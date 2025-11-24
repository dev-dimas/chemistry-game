import { useAlertStore } from "@/stores/alertStore";
import { useGameStore } from "@/stores/gameStore";
import { useLanguageStore } from "@/stores/languageStore";
import React, { useState } from "react";
import { BackgroundPattern } from "./BackgroundPattern";
import { Button } from "./Button";
import { HowToPlayModal } from "./HowToPlayModal";
import { Input } from "./Input";

const LandingPage: React.FC = () => {
  const { createRoom, joinRoom } = useGameStore();
  const { t, language, setLanguage } = useLanguageStore();
  const { showAlert } = useAlertStore();
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
    <div className="relative flex flex-col items-center justify-center min-h-screen p-4 overflow-hidden bg-indigo-900">
      {/* Abstract Background Pattern */}
      <BackgroundPattern />

      <div className="bg-white p-8 rounded-[40px] shadow-2xl max-w-md w-full flex flex-col gap-8 text-center border-8 border-blue-100 relative z-10">
        <div className="flex flex-col items-center gap-2">
          <img
            src="/android-chrome-512x512.png"
            alt="Chemistry Game Logo"
            className="w-20 h-20"
          />
          <h1 className="text-5xl font-black tracking-tight text-blue-600">
            {t.title}
          </h1>
          <p className="text-lg font-medium text-gray-400">{t.subtitle}</p>
          {/* Language Toggle */}
          <div className="inline-flex p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => setLanguage("en")}
              className={`px-6 py-2 text-sm font-semibold transition-all duration-200 rounded-md ${
                language === "en"
                  ? "bg-white text-blue-600 shadow-md"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLanguage("id")}
              className={`px-6 py-2 text-sm font-semibold transition-all duration-200 rounded-md ${
                language === "id"
                  ? "bg-white text-blue-600 shadow-md"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Indonesia
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
              className="tracking-wide text-center uppercase"
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

export default LandingPage;
