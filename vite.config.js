import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "localhost",
    port: 3000,
    strictPort: true,
    open: true,
    cors: true,
    hmr: {
      overlay: true,
    },
  },
  preview: {
    port: 3000,
  },
  // Configuração para garantir que todas as rotas sejam redirecionadas para o index.html
  base: "/",
  publicDir: "public",
  build: {
    outDir: "dist",
    assetsDir: "assets",
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
  plugins: [
    react(),
  ],
  optimizeDeps: {
    include: ['react-dom/client']
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});