import React, { useState } from "react";
import { useGameStore } from "@/stores/gameStore";
import { useLanguageStore } from "@/stores/languageStore";
import { useNavigate } from "@/router";
import { Button } from "./Button";
import { Toast } from "./Toast";
import { BackgroundPattern } from "./BackgroundPattern";

export const Lobby: React.FC = () => {
  const { room, player, startGame, kickPlayer, leaveRoom } = useGameStore();
  const { t } = useLanguageStore();
  const [showToast, setShowToast] = useState(false);
  const navigate = useNavigate();

  if (!room || !player) return null;

  const copyLink = () => {
    const url = `${window.location.origin}/room/${room.id}`;
    navigator.clipboard.writeText(url);
    setShowToast(true);
  };

  if (room.state === "ENDED") {
    const readyPlayers = room.players.filter((p) => p.isReady);
    const busyPlayers = room.players.filter((p) => !p.isReady);

    return (
      <div className="relative flex flex-col items-center min-h-screen p-4 pt-12 overflow-hidden bg-indigo-900">
        <BackgroundPattern />
        <div className="relative z-10 bg-white p-6 rounded-[32px] shadow-xl max-w-2xl w-full flex flex-col gap-6 border-b-8 border-indigo-200">
          <h2 className="text-3xl font-black text-center text-indigo-800">
            {t.lobby} ({room.id})
          </h2>

          <div className="p-4 border-l-4 border-yellow-400 bg-yellow-50 rounded-xl">
            <p className="font-bold text-center text-yellow-800">
              {t.waitingForPlayers} ({readyPlayers.length}/{room.players.length}
              )
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-2xl">
              <h3 className="mb-2 text-sm font-bold text-gray-400 uppercase">
                {t.ready}
              </h3>
              {readyPlayers.map((p) => (
                <div key={p.id} className="flex items-center gap-2 mb-2">
                  <span className="font-bold text-green-500">✓</span>
                  <span className="font-bold text-gray-700">{p.name}</span>
                </div>
              ))}
            </div>
            <div className="p-4 bg-gray-50 rounded-2xl">
              <h3 className="mb-2 text-sm font-bold text-gray-400 uppercase">
                {t.reviewingResults}
              </h3>
              {busyPlayers.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2 mb-2 opacity-50"
                >
                  <span className="text-xs text-gray-400">...</span>
                  <span className="font-bold text-gray-600">{p.name}</span>
                  {player.isCreator && (
                    <button
                      onClick={() => kickPlayer(p.id)}
                      className="ml-auto text-xs font-bold text-red-500 hover:underline"
                    >
                      {t.kick}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {player.isCreator && (
            <Button
              onClick={startGame}
              disabled={room.players.length < 2 || busyPlayers.length > 0}
              className={`w-full ${
                room.players.length < 2 || busyPlayers.length > 0
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              {room.players.length < 2
                ? t.needPlayers
                : busyPlayers.length > 0
                ? t.waitingForPlayers
                : t.startGame}
            </Button>
          )}

          <Button
            variant="danger"
            onClick={() => {
              leaveRoom();
              navigate("/");
            }}
            className="w-full"
          >
            {t.leaveRoom}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center min-h-screen p-4 pt-12 overflow-hidden bg-indigo-900">
      <BackgroundPattern />
      <div className="relative z-10 bg-white p-6 rounded-[32px] shadow-xl max-w-2xl w-full flex flex-col gap-6 border-b-8 border-indigo-200">
        <div className="flex items-center justify-between pb-4 border-b-2 border-gray-100">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-indigo-800">
              {t.room}: {room.id}
            </h2>
            <p className="text-sm font-bold text-gray-400">
              {t.waitingForPlayers}
            </p>
          </div>
          <button
            onClick={copyLink}
            className="px-4 py-2 font-bold text-indigo-600 transition-colors bg-indigo-100 rounded-xl hover:bg-indigo-200"
          >
            🔗 {t.inviteLink}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {room.players.map((p) => (
            <div
              key={p.id}
              className={`relative group flex flex-col items-center p-4 rounded-2xl border-2 transition-all ${
                p.id === player.id
                  ? "bg-yellow-50 border-yellow-400 transform -translate-y-1 shadow-md"
                  : "bg-white border-gray-200"
              }`}
            >
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold text-white mb-2 shadow-inner ${
                  p.isCreator ? "bg-yellow-400" : "bg-blue-400"
                }`}
              >
                {p.name.charAt(0).toUpperCase()}
              </div>
              <span className="w-full font-bold text-center text-gray-700 truncate">
                {p.name}
              </span>
              {p.isCreator && (
                <span className="text-[10px] bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-full font-black mt-1">
                  {t.owner}
                </span>
              )}
              {!p.isConnected && (
                <span className="text-[10px] bg-red-100 text-red-500 px-2 py-0.5 rounded-full font-black mt-1">
                  {t.offline}
                </span>
              )}

              {player.isCreator && p.id !== player.id && (
                <button
                  onClick={() => kickPlayer(p.id)}
                  className="absolute flex items-center justify-center font-bold text-white transition-all bg-red-500 rounded-full shadow-md opacity-0 -top-2 -right-2 w-7 h-7 group-hover:opacity-100 hover:scale-110"
                  title={t.kickPlayer}
                >
                  &times;
                </button>
              )}
            </div>
          ))}
        </div>

        {room.spectators.length > 0 && (
          <div className="p-4 mt-4 border-2 border-gray-200 border-dashed bg-gray-50 rounded-2xl">
            <h3 className="mb-2 text-sm font-bold tracking-wider text-gray-400 uppercase">
              {t.spectators}
            </h3>
            <div className="flex flex-wrap gap-2">
              {room.spectators.map((s) => (
                <span
                  key={s.id}
                  className="px-3 py-1 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-full"
                >
                  {s.name}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col justify-center gap-3 mt-4">
          {player.isCreator ? (
            <Button
              onClick={startGame}
              disabled={room.players.length < 2}
              className={`w-full text-xl py-4 ${
                room.players.length < 2 ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {room.players.length < 2 ? t.needPlayers : t.startGame}
            </Button>
          ) : (
            <div className="flex items-center justify-center gap-2 px-6 py-3 font-bold text-center text-indigo-400 animate-pulse bg-indigo-50 rounded-xl">
              <span className="animate-spin">⏳</span> {t.waitingForHost}
            </div>
          )}

          <button
            onClick={() => {
              leaveRoom();
              navigate("/");
            }}
            className="py-2 text-sm font-bold text-gray-400 hover:text-red-500"
          >
            {t.leaveRoom}
          </button>
        </div>
      </div>
      <Toast
        message={t.linkCopied}
        show={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
};
