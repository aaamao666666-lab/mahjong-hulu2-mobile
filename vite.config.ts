import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves this project from /mahjong-hulu2-mobile/, not the domain root.
  base: "/mahjong-hulu2-mobile/",
});
