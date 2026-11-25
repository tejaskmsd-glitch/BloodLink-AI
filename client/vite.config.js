import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables from the project root (e.g. PORT)
  const env = loadEnv(mode, path.resolve(__dirname, '..'), '');
  const backendPort = env.PORT || 5002;
  const backendTarget = env.BACKEND_URL || `http://localhost:${backendPort}`;

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
          secure: false
        }
      }
    }
  };
});
