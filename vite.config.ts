import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import vercel from "vite-plugin-vercel";

// https://vite.dev/config/
export default defineConfig({
  base: "/",
  build: { outDir: "dist" },
  plugins: [react(), vercel()],
});
