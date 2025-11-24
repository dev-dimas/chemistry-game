import { useEffect } from "react";
import { Routes } from "@generouted/react-router";
import { useGameStore } from "./stores/gameStore";
import { Alert } from "./components/Alert";

function App() {
  const initializeSocket = useGameStore((state) => state.initializeSocket);

  useEffect(() => {
    initializeSocket();
  }, [initializeSocket]);

  return (
    <>
      <Routes />
      <Alert />
    </>
  );
}

export default App;
