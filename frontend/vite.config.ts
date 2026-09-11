import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Local development: the SPA runs on :5173 and proxies API + storage to the
// Laravel backend on :8000 so cookies are same-origin, exactly like the
// single-origin production deployment.
export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:8000', changeOrigin: true },
      '/sanctum': { target: 'http://localhost:8000', changeOrigin: true },
      '/storage': { target: 'http://localhost:8000', changeOrigin: true },
    },
  },

  base: '/',

  build: {
    outDir: '../backend/public/build',
    emptyOutDir: true,
    manifest: true,
    rollupOptions: {
      input: '/src/main.tsx',
    },
  },
})