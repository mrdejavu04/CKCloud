import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Khi nào gọi đường dẫn bắt đầu bằng /api
      '/api': {
        target: 'http://localhost:8080', // Tự động chuyển hướng sang API Gateway ở máy dev
        changeOrigin: true,
        secure: false,
      },
    },
  },
})