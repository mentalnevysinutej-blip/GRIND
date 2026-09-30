import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Tauri očekává pevný port (viz src-tauri/tauri.conf.json → build.devUrl).
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 5189,
    strictPort: true,
  },
})
