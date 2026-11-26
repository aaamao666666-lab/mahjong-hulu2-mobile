import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import react from "@vitejs/plugin-react";

// Vue mounts the active game page; React stays enabled for legacy TSX modules.
export default defineConfig({
  plugins: [vue(), react()],
  base: "./",
});
