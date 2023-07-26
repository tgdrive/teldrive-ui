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
  buildExcludes: [/chunks\/react-syntax-highlighter.*$/],
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
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*'
      },
    ]
  },
})

export default isDevelopment ? config : withPWA(config)
