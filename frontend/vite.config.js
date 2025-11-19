import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Khi nào gọi đường dẫn bắt đầu bằng /api
      '/api': {
        target: 'http://localhost:5000', // Tự động chuyển hướng sang Backend
        changeOrigin: true,
        secure: false,
      },
    },
  },
})