const { withSentryConfig } = require('@sentry/nextjs')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

module.exports = withSentryConfig(nextConfig, {
  // Suppress source map upload logs in build output
  silent: true,

  // Upload source maps only when SENTRY_AUTH_TOKEN is set
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Route browser requests to Sentry through Next.js rewrites to avoid ad blockers
  tunnelRoute: '/monitoring',

  // Automatically tree-shake Sentry logger in production
  disableLogger: true,

  // Don't widen source maps in development (faster builds)
  hideSourceMaps: true,
})
