import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Use relative base so assets load correctly when served from Vercel
export default defineConfig({
  plugins: [react()],
  base: "./",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: true,
  },
});
