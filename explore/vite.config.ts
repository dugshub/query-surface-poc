import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The Explore app is a pure SPA client of the query surface. In dev it proxies
// /api/* to the framework-free Bun adapter (src/server.ts), so you run the two
// side by side:
//   terminal 1:  bun src/server.ts          # → http://localhost:3577 (the surface)
//   terminal 2:  cd explore && bun run dev   # → http://localhost:5377 (this UI)
// Override the backend with QS_API_TARGET if you booted the server on another port.
const API_TARGET = process.env.QS_API_TARGET ?? 'http://localhost:3577';

export default defineConfig({
  plugins: [react()],
  server: {
    // Deliberately NOT Vite's default 5173 — that collides with other local
    // apps. 5377 mirrors the surface's 3577. strictPort: fail loudly if it's
    // taken rather than silently squatting the next free port (someone else's).
    port: 5377,
    strictPort: true,
    proxy: {
      '/api': { target: API_TARGET, changeOrigin: true },
    },
  },
});
