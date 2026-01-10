import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  console.log('Vite build mode:', mode);
  // In development, use empty string to leverage Vite's proxy to localhost:4000
  // In production, also empty string as nginx handles proxying
  const apiBaseUrl = '';
  console.log('API Base URL:', apiBaseUrl || '(using proxy)');

  return {
    plugins: [react()],
    define: {
      // API calls go through proxy in both dev (Vite) and prod (nginx)
      __API_BASE_URL__: JSON.stringify(apiBaseUrl),
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:4000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
