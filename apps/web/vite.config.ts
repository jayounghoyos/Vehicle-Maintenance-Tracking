import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

const repoRoot = fileURLToPath(new URL('../..', import.meta.url));

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // read the repo-root .env with no prefix filter, so the proxy target
  // follows the same PORT the API binds to instead of drifting from it
  const env = loadEnv(mode, repoRoot, '');
  const apiPort = env.PORT ?? '3002';

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      // the browser only ever calls /api, so no API host is baked into
      // the client and there is no CORS in development
      proxy: {
        '/api': {
          target: `http://localhost:${apiPort}`,
          changeOrigin: true,
        },
      },
    },
  };
});
