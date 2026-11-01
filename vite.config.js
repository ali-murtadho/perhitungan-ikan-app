import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // agar bisa dibuka dari HP di jaringan Wi-Fi yang sama
    proxy: {
      '/api': `http://localhost:${process.env.PORT || 3001}`,
    },
  },
});
