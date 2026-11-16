
import { defineConfig } from "vitest/config";

export default defineConfig({
  // GitHub Pages deployment path
  base: "/memory-match/",

  server: {
    host: "localhost",
    port: 5173,
    strictPort: true,
    allowedHosts: ["wing-living-encode.ngrok-free.dev"],
  },

  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true,
  },

  test: {
    environment: "jsdom",
    globals: true,
    include: ["tests/**/*.test.ts"],
  },
});
