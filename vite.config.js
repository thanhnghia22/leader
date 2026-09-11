import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { handleApiRequest } from './server/apiHandler.js';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'api-server-middleware',
      configureServer(server) {
        server.middlewares.use('/api', (req, res, next) => {
          handleApiRequest(req, res, next);
        });
      },
    },
  ],
  server: {
    port: 3000,
    host: true,
    open: true,
  },
});
