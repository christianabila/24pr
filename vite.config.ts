import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The browser blocks direct cross-origin fetches to 24pullrequests.com (CORS).
// Requests to /api/projects are forwarded server-side by Vite instead.
const proxy = {
  '/api/projects': {
    target: 'https://24pullrequests.com',
    changeOrigin: true,
    rewrite: () => '/projects.json',
  },
}

export default defineConfig({
  plugins: [react()],
  server: { proxy },
  preview: { proxy },
})
