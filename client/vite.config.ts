/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

// Where the game server runs in development. Vite forwards Socket.IO and /api to it,
// so the browser (and phones on your Wi-Fi) only ever talk to one address.
const GAME_SERVER = process.env.GAME_SERVER_URL ?? 'http://localhost:3001';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Listen on the LAN so phones on the same Wi-Fi can open the dev site.
    host: true,
    proxy: {
      '/socket.io': { target: GAME_SERVER, ws: true, changeOrigin: true },
      '/api': { target: GAME_SERVER, changeOrigin: true },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
});
