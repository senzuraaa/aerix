import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Frontend only. Fungsi serverless di folder /api dijalankan oleh Vercel
// (atau `npx vercel dev` saat pengembangan lokal dengan backend).
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
});
