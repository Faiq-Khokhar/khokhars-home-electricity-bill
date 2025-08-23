import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api/lesco": {
        target: "https://www.lesco.gov.pk:36260",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/lesco/, ""),
      },
    },
  },
});
