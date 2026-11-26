import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Relative URLs work on both the Workers root and a GitHub Pages subpath.
  base: "./",
});
