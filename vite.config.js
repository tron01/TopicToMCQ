import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  define: {
    'process.env.VITE_GOOGLE_API_KEY': `"${process.env.VITE_GOOGLE_API_KEY}"`,
  },
  plugins: [react()],
})
