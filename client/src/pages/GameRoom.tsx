import React, { useState } from "react";
import { useGame } from "../context/GameContext";
import { useLanguage } from "../context/LanguageContext";
import { Button } from "../components/Button";
import { Input } from "../components/Input";

export const GameRoom: React.FC = () => {
  const { room, player, submitAnswer, returnToLobby, nextRound } = useGame();
  const { t } = useLanguage();
  const [answer, setAnswer] = useState("");

  if (!room || !player) return null;

  const currentWord = room.words[room.currentWordIndex];
  const hasAnswered = room.currentAnswers[player.id] !== undefined;
  const allAnswered = room.players
    .filter((p) => p.isConnected)
    .every((p) => room.currentAnswers[p.id] !== undefined);

  const showResults = allAnswered;

  const handleSubmit = () => {
    if (answer.trim()) {
      submitAnswer(answer);
      setAnswer(""); // Clear for next round locally, though component might remount
    }
  };

  // Determine Game Over Message
  const getGameOverMessage = () => {
    // Calculate average match rate or total score
    // Total possible score per player = total rounds
    // Chemistry % = (Total Score / Total Rounds) * 100

    // Let's calculate Chemistry % based on group success
    // A "Chemistry Match" happens if everyone has the same answer.
    // If match -> +1 score for everyone.
    // Since everyone gets points together, any player's score is the "Team Score".

    const maxScore = room.players[0]?.score || 0;
    const totalRounds = room.words.length; // Use actual number of rounds from game
    const percent = Math.round((maxScore / totalRounds) * 100);

    if (percent === 100)
      return {
        msg: t.chemistryStrong,
        sub: t.perfectTelepathic,
        emoji: "🤯",
      };
    if (percent >= 80)
      return {
        msg: t.chemistryStrong,
        sub: t.amazingSync,
        emoji: "🔥",
      };
    if (percent >= 50)
      return {
        msg: t.chemistryGood,
        sub: t.notBadPractice,
        emoji: "✨",
      };
    return {
      msg: t.chemistryBad,
      sub: t.sureKnowEachOther,
      emoji: "💀",
    };
  };

  if (room.state === "ENDED") {
    const { msg, sub, emoji } = getGameOverMessage();

    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-neutral-200">
        <div className="bg-white p-8 rounded-[32px] shadow-xl max-w-lg w-full text-center border-8 border-blue-100 relative overflow-hidden animate-fade-in">
          <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500"></div>

          <div className="mt-4 mb-6">
            <div className="mb-2 text-6xl">{emoji}</div>
            <h1 className="text-3xl font-black leading-tight text-blue-900">
              {msg}
            </h1>
            <p className="font-bold text-gray-500">{sub}</p>
          </div>

          <div className="p-4 mb-8 border-2 border-blue-100 bg-blue-50 rounded-2xl">
            <span className="block text-sm font-bold tracking-widest text-blue-400 uppercase">
              {t.chemistryScore}
            </span>
            <span className="block text-6xl font-black text-blue-600">
              {Math.round(((room.players[0]?.score || 0) / room.words.length) * 100)}%
            </span>
          </div>

          <div className="mb-8 space-y-3">
            {room.players
              .sort((a, b) => b.score - a.score)
              .map((p, index) => (
                <div
                  key={p.id}
                  className={`flex justify-between items-center p-4 rounded-2xl border-2 ${
                    index === 0
                      ? "bg-yellow-50 border-yellow-300"
                      : "bg-white border-gray-100"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg ${
                        index === 0
                          ? "bg-yellow-400 text-yellow-900"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      #{index + 1}
                    </div>
                    <span className="text-lg font-bold text-gray-700">
                      {p.name}
                    </span>
                  </div>
                  <span className="text-xl font-black text-blue-500">
                    {p.score} {t.pts}
                  </span>
                </div>
              ))}
          </div>

          <Button
            onClick={returnToLobby}
            className="w-full transition-all transform shadow-lg hover:scale-105 active:scale-95"
          >
            {t.backToLobby}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center min-h-screen px-4 pb-4 bg-neutral-200">
      {/* Subtle Background Pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-5"
        style={{
          backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      ></div>

      {/* Header / Scoreboard */}
      <div className="w-full max-w-4xl bg-white rounded-b-[32px] shadow-sm p-4 mb-8 flex justify-between overflow-x-auto gap-4 border-b-4 border-blue-100 no-scrollbar z-10">
        {room.players.map((p) => (
          <div
            key={p.id}
            className={`flex flex-col items-center min-w-[80px] transition-opacity ${
              !p.isConnected ? "opacity-50" : ""
            }`}
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-white mb-1 transition-colors ${
                room.currentAnswers[p.id]
                  ? "bg-green-500 shadow-green-200 shadow-lg"
                  : "bg-gray-200"
              }`}
            >
              {p.score}
            </div>
            <span className="w-full text-xs font-bold text-center text-gray-500 truncate">
              {p.name}
            </span>
          </div>
        ))}
      </div>

      <div className="z-10 flex flex-col items-center justify-center flex-1 w-full max-w-2xl">
        <div className="p-8 rounded-[32px] mb-10 text-center bg-white">
          <span className="px-4 py-1 text-xs font-black tracking-widest text-blue-400 uppercase bg-white border-2 border-blue-100 rounded-full shadow-sm">
            {t.word} {room.currentWordIndex + 1} / {room.words.length}
          </span>
          <h1 className="mt-4 text-5xl font-black tracking-tight text-blue-900 md:text-7xl drop-shadow-sm">
            {currentWord}
          </h1>
        </div>

        {!showResults ? (
          <div className="w-full max-w-md bg-white p-8 rounded-[32px] shadow-xl border-b-8 border-blue-100 transition-all">
            {hasAnswered ? (
              <div className="py-8 text-center">
                <div className="mb-6 text-6xl animate-bounce">🤫</div>
                <p className="text-lg font-bold text-gray-400">
                  {t.waitingForOthers}
                </p>
              </div>
            ) : player.isCreator ||
              !room.spectators.find((s) => s.id === player.id) ? (
              // Player Input
              <div className="flex flex-col gap-6">
                <Input
                  autoFocus
                  placeholder={t.typeWord}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                />
                <Button onClick={handleSubmit} className="py-4 text-lg">
                  {t.submit}
                </Button>
              </div>
            ) : (
              // Spectator View
              <div className="py-8 text-center">
                <div className="mb-6 text-6xl">👀</div>
                <p className="text-lg font-bold text-gray-400">
                  {t.spectating}
                </p>
              </div>
            )}
          </div>
        ) : (
          // Results View
          <div className="w-full animate-fade-in">
            <div className="grid grid-cols-1 gap-4 mb-8 sm:grid-cols-2">
              {room.players.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-5 transition-transform transform bg-white border-b-4 border-gray-100 shadow-md rounded-2xl hover:-translate-y-1"
                >
                  <span className="font-bold text-gray-500">{p.name}</span>
                  <span className="text-2xl font-black text-blue-600">
                    {room.currentAnswers[p.id]}
                  </span>
                </div>
              ))}
            </div>

            {/* Match Indicator */}
            {(() => {
              const answers = Object.values(room.currentAnswers).map((a) =>
                a.trim().toLowerCase()
              );
              const isMatch = new Set(answers).size === 1;
              return isMatch ? (
                <div className="mt-4 text-center animate-bounce-up">
                  <span className="inline-block px-8 py-6 text-3xl font-black text-green-600 bg-green-100 border-b-8 border-green-200 shadow-xl md:text-4xl rounded-3xl">
                    {t.chemistry}
                  </span>
                </div>
              ) : (
                <div className="mt-4 text-center">
                  <span className="px-6 py-3 text-2xl font-bold text-gray-300 bg-white border-2 border-gray-100 rounded-full shadow-sm">
                    {t.noMatch}
                  </span>
                </div>
              );
            })()}

            {/* Next Round Button (only show if not last round) */}
            {room.currentWordIndex < room.words.length - 1 && (
              <div className="flex justify-center mt-12">
                {player.isCreator ? (
                  <Button
                    onClick={nextRound}
                    variant="secondary"
                    className="px-12 py-4 text-xl shadow-xl"
                  >
                    {t.nextWord} 👉
                  </Button>
                ) : (
                  <div className="px-6 py-3 font-bold text-center text-gray-400 bg-white rounded-full shadow-sm animate-pulse">
                    {t.waitingForHostNext}
                  </div>
                )}
              </div>
            )}
            
            {/* Final round indicator - will auto-advance */}
            {room.currentWordIndex === room.words.length - 1 && (
              <div className="flex justify-center mt-12">
                <div className="flex flex-col items-center gap-2 animate-pulse">
                  <span className="text-2xl font-black text-blue-600">🏁</span>
                  <span className="text-lg font-bold text-blue-500">
                    {t.finalRoundComplete || "Final Round Complete!"}
                  </span>
                  <span className="text-sm text-gray-400">
                    {t.showingResults || "Showing results..."}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
