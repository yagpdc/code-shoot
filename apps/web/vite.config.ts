import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  // The single .env lives at the monorepo root, but vite's root is apps/web.
  envDir: "../..",
  server: { port: 5173 },
});
