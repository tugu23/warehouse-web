import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  console.log('Vite build mode:', mode);
  const apiBaseUrl = mode === 'production' ? '' : 'http://43.231.115.209:3000';
  console.log('API Base URL:', apiBaseUrl);
  
  return {
    plugins: [react()],
    define: {
      // In production, API calls go through nginx proxy (empty baseURL)
      // In development, use the backend server directly
      '__API_BASE_URL__': JSON.stringify(apiBaseUrl),
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:4000',
          changeOrigin: true,
          secure: false,
        }
      }
    }
  };
})
