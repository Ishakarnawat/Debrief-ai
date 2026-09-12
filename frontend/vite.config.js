import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      // Proxy Resume Screener API calls to FastAPI microservice
      "/api/v1": {
        target: "http://localhost:8001",
        changeOrigin: true,
      },
      // Proxy general backend API calls to Express backend
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});
