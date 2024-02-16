import { existsSync } from "fs"
import { resolve } from "path"
import { TanStackRouterVite } from "@tanstack/router-vite-plugin"
import react from "@vitejs/plugin-react"
import AdmZip from "adm-zip"
import axios from "axios"
import { defineConfig, Plugin, splitVendorChunkPlugin } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"

function PdfJsPlugin(): Plugin {
  return {
    name: "pdf-js-plugin",
    apply: "build",
    async buildStart() {
      const pdfJsDir = resolve(__dirname, "public", "pdf.js")
      if (existsSync(pdfJsDir)) {
        return
      }
      const response = await axios.get(
        "https://github.com/divyam234/pdf.js/releases/download/latest/pdfjs.zip",
        {
          responseType: "arraybuffer",
        }
      )

      const zip = new AdmZip(response.data)

      zip.extractAllTo(pdfJsDir, true)
    },
  }
}

export default defineConfig(({ mode }) => {
  return {
    plugins: [
      TanStackRouterVite(),
      react(),
      tsconfigPaths(),
      splitVendorChunkPlugin(),
      PdfJsPlugin(),
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
    build: {
      minify: "terser",
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
        format: {
          comments: false,
        },
      },
    },
  }
})
