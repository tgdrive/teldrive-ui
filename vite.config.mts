import react from "@vitejs/plugin-react"
import { defineConfig, splitVendorChunkPlugin } from "vite"
import removeConsole from "vite-plugin-remove-console"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tsconfigPaths(),
      splitVendorChunkPlugin(),
      removeConsole({ includes: ["log", "warn", "error", "info", "debug"] }),
    ],
    preview: {
      port: 5173,
    },
  }
})
