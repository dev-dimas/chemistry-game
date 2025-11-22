import React, { useState } from "react";
import { useGame } from "../context/GameContext";
import { useLanguage } from "../context/LanguageContext";
import { useAlert } from "../context/AlertContext";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { useParams } from "react-router-dom";

export const JoinRoomPage: React.FC = () => {
  const { roomId } = useParams();
  const { joinRoom } = useGame();
  const { t } = useLanguage();
  const { showAlert } = useAlert();
  const [name, setName] = useState("");

  const handleJoin = () => {
    if (!name.trim()) {
      showAlert(t.enterName);
      return;
    }
    if (roomId) {
      joinRoom(roomId, name);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-blue-50">
      <div className="bg-white p-8 rounded-[32px] shadow-xl max-w-md w-full flex flex-col gap-8 text-center border-8 border-blue-100">
        <div>
          <h1 className="mb-2 text-3xl font-black text-blue-600">
            {t.join} Room {roomId}
          </h1>
          <p className="font-medium text-gray-400">{t.subtitle}</p>
        </div>

        <Input
          placeholder={t.yourName}
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={12}
        />

        <Button variant="secondary" onClick={handleJoin} disabled={!name}>
          {t.join}
        </Button>
      </div>
    </div>
  );
};
