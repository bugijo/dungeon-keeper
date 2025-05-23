
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
// import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "localhost",
    port: 3000,
    strictPort: true,
    open: true,
    proxy: {},
    cors: true,
    hmr: {
      overlay: true,
    },
    // Configuração crucial para o React Router funcionar corretamente
    middlewareMode: false,
    fs: {
      strict: true,
      allow: ['..'],
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
    // Garantir que o historyApiFallback funcione na build
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
  ].filter(Boolean),
  optimizeDeps: {
    include: ['react-dom/client']
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
