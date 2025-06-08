// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// PostCSS 플러그인으로 Tailwind와 Autoprefixer를 직접 등록
import postcssTailwind from "@tailwindcss/postcss";
import autoprefixer from "autoprefixer";

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [
        postcssTailwind(),    // Tailwind CSS 지시자를 처리
        autoprefixer(),       // 벤더 프리픽스를 자동 추가
      ],
    },
  },
});
