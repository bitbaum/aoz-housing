const path = require('node:path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // fitfoot lives inside the aoz-housing monorepo checkout, which has its
  // own lockfile — pin the workspace root explicitly so Turbopack never
  // infers the parent repo and tries to bundle its unrelated files.
  turbopack: {
    root: path.join(__dirname),
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
}

module.exports = nextConfig
