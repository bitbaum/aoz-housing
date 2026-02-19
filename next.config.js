const { withSentryConfig } = require('@sentry/nextjs')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
    ]
  },
}

module.exports = withSentryConfig(nextConfig, {
  // Suppress source map upload logs in build output
  silent: true,

  // Upload source maps only when SENTRY_AUTH_TOKEN is set
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Route browser requests to Sentry through Next.js rewrites to avoid ad blockers
  tunnelRoute: '/monitoring',

  // Tree-shake Sentry debug logging in production
  bundleSizeOptimizations: {
    excludeDebugStatements: true,
  },

  // Don't widen source maps in development (faster builds)
  hideSourceMaps: true,
})
