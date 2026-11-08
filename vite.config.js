import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Frontend for the Tauri app. No backend proxy — the LLM request runs in Rust.
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: { port: 5173, strictPort: true },
  build: { outDir: 'dist' }
})
