import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    open: false
  },
  build: {
    target: 'esnext',
    chunkSizeWarningLimit: 1000
  },
  plugins: [
    {
      name: 'api-middleware',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url && req.url.startsWith('/api/')) {
            try {
              const { default: handler } = await import('./api/[...route].js');
              await handler(req, res);
            } catch (err) {
              console.error('API middleware error:', err);
              if (!res.headersSent) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ ok: false, error: { code: 'INTERNAL_ERROR', message: String(err.message || err) } }));
              }
            }
            return;
          }
          next();
        });
      }
    }
  ]
});
