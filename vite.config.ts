import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 直接從系統環境變數讀取並定義給前端 
export default defineConfig({
  plugins: [react()],
  base: '/podcast-producer/',
  define: {
    'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(process.env.VITE_GEMINI_API_KEY)
  }
})
