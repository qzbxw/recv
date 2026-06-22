/// <reference types="vitest/config" />

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/app/",
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          if (id.includes("/@tiptap/") || id.includes("/prosemirror-")) {
            return "vendor-editor-tiptap";
          }

          if (id.includes("/marked/")) {
            return "vendor-markdown";
          }

          if (id.includes("/qrcode/")) {
            return "vendor-qrcode";
          }

          if (id.includes("/react/") || id.includes("/react-dom/") || id.includes("/scheduler/")) {
            return "vendor-react";
          }

          if (id.includes("/react-router-dom/") || id.includes("/@remix-run/router/")) {
            return "vendor-router";
          }
        },
      },
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    cors: true,
    origin: "http://localhost:3000",
    hmr: {
      clientPort: 3000,
      host: "localhost",
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
  },
});
