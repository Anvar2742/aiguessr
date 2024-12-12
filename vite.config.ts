import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Binds to all network interfaces
    port: 3000 // Specify a port if you prefer something specific
  },
  base: "/",
  build: {
    outDir: 'public', // Specify your desired output directory
  },
})
