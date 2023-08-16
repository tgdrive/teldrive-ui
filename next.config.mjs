import NextBundleAnalyzer from "@next/bundle-analyzer"
import nextPWA from "next-pwa"

const withBundleAnalyzer = NextBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
})

const isDevelopment = process.env.NODE_ENV === "development"

const withPWA = nextPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  swSrc: "service-worker.js",
})

const config = withBundleAnalyzer({
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ["@svgr/webpack"],
    })

    return config
  },
  output: "standalone",
  transpilePackages: ["@bhunter179/chonky"],
  modularizeImports: {
    "@mui-material": {
      transform: "@mui-material/{{member}}",
    },
    "@mui/icons-material": {
      transform: "@mui/icons-material/{{member}}",
    },
  },
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  compiler: {
    ...(!isDevelopment && {
      removeConsole: {
        exclude: ["error"],
      },
    }),
  },

  async redirects() {
    return [
      {
        source: "/",
        destination: "/my-drive",
        permanent: true,
      },
    ]
  },
})

export default isDevelopment ? config : withPWA(config)
