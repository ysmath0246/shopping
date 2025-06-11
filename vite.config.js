// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import postcssTailwind from "@tailwindcss/postcss";
import autoprefixer from "autoprefixer";

export default defineConfig({
  base: "/shopping/",   // <-- ✅ 이 줄 추가! (리포지토리명과 같아야 함)
  plugins: [react()],
  css: {
    postcss: {
      plugins: [
        postcssTailwind(),
        autoprefixer(),
      ],
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
