import { TanStackRouterVite } from "@tanstack/router-vite-plugin"
import react from "@vitejs/plugin-react"
import { defineConfig, splitVendorChunkPlugin } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig(({ mode }) => {
  return {
    plugins: [
      react(),
      tsconfigPaths(),
      TanStackRouterVite(),
      splitVendorChunkPlugin(),
    ],
    esbuild: {
      drop: mode === "production" ? ["console", "debugger"] : [],
    },
    server: {
      proxy: {
        "/api": {
          target: "http://localhost:5000",
          ws: true,
        },
      },
    },
  }
})
