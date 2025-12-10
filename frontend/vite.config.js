import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['frontend'],
    port: 80,
    hmr: {
      host: 'checkpoint.buzz'
    },
    watch: {
      usePolling: true,
      interval: 100
    }
  },
});
