import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Ensures assets load correctly in subdirectories like /operaciones/auditorias/
  server: {
    port: 3000,
    open: true
  }
})
