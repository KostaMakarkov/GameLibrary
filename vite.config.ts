import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Base path must match the GitHub Pages repo path (e.g. "/game-library/").
// Set BASE_PATH when building for deployment; defaults to "/" for local dev.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), tailwindcss()],
})
