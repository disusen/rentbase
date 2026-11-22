import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development every /api call is forwarded to the ASP.NET API (dotnet run → :8080).
// The browser then sees one origin, so the HttpOnly refresh cookie works without CORS.
// On Render the static site does the same with a rewrite rule (see render.yaml).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/swagger': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
