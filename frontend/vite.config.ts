import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",  // Listen on all network interfaces
    port: 5173,
    watch: {
      usePolling: true,  // Docker compatibility
      interval: 1000,    // Check every second
    },
    hmr: {
      protocol: "ws",
      host: "localhost",
      port: 5173,
      clientPort: 5173,
      overlay: true,     // Show errors in browser overlay
    },
  },
})
