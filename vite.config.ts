import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  // Relative base so the static build can be hosted from any sub-path (e.g. GitHub Pages).
  base: './',
  server: { port: 5173 },
  // Single-bundle prototype (~280 kB gzipped) — no need for code-splitting.
  build: { chunkSizeWarningLimit: 1200 },
})
