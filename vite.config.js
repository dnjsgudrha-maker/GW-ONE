import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: process.env.VITE_BASE_PATH || "./",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "GW ONE",
        short_name: "GW ONE",
        description: "현장의 모든 것을 하나로",
        theme_color: "#1261c9",
        background_color: "#f4f7fb",
        display: "standalone",
        start_url: "./",
        icons: [
          { src: "icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
          { src: "icon-512.svg", sizes: "512x512", type: "image/svg+xml" }
        ]
      }
    })
  ]
});
