import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import generouted from "@generouted/react-router/plugin";
import removeConsole from "vite-plugin-remove-console";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    generouted(),
    removeConsole({ includes: ["log", "warn"] }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
