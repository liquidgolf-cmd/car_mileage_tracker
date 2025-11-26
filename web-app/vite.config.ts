import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: true, // Allow external connections
    open: true,
    strictPort: false // Allow fallback to next available port if 5174 is taken
  }
})

