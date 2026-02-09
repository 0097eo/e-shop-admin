import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.js'],
    coverage: {
      include: ['src/**/*.{js,jsx,ts,tsx}'],
      reporter: ['text', 'json', 'html'],
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://eshop-pk10.onrender.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/'),
      }
    }
  }
})
