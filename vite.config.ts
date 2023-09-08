import react from "@vitejs/plugin-react"
import { defineConfig, splitVendorChunkPlugin } from "vite"
import { VitePWA } from "vite-plugin-pwa"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    splitVendorChunkPlugin(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "TelDrive",
        short_name: "Teldrive",
        start_url: ".",
        display: "minimal-ui",
        icons: [
          {
            sizes: "114x114",
            src: "https://github.githubassets.com/apple-touch-icon-114x114.png",
          },
          {
            sizes: "120x120",
            src: "https://github.githubassets.com/apple-touch-icon-120x120.png",
          },
          {
            sizes: "144x144",
            src: "https://github.githubassets.com/apple-touch-icon-144x144.png",
          },
          {
            sizes: "152x152",
            src: "https://github.githubassets.com/apple-touch-icon-152x152.png",
          },
          {
            sizes: "180x180",
            src: "https://github.githubassets.com/apple-touch-icon-180x180.png",
          },
          {
            sizes: "57x57",
            src: "https://github.githubassets.com/apple-touch-icon-57x57.png",
          },
          {
            sizes: "60x60",
            src: "https://github.githubassets.com/apple-touch-icon-60x60.png",
          },
          {
            sizes: "72x72",
            src: "https://github.githubassets.com/apple-touch-icon-72x72.png",
          },
          {
            sizes: "76x76",
            src: "https://github.githubassets.com/apple-touch-icon-76x76.png",
          },
          {
            src: "https://github.githubassets.com/app-icon-192.png",
            type: "image/png",
            sizes: "192x192",
          },
          {
            src: "https://github.githubassets.com/app-icon-512.png",
            type: "image/png",
            sizes: "512x512",
          },
        ],
      },
    }),
  ],
})
