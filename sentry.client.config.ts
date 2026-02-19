import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Only enable in production
  enabled: process.env.NODE_ENV === 'production',

  // Performance monitoring — sample 10% of transactions
  tracesSampleRate: 0.1,

  // Session replay — sample 1% of sessions, 100% on error
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 1.0,

  // Strip potential PII from error messages
  beforeSend(event) {
    if (event.message) {
      event.message = event.message.replace(/RES-\d+/g, 'RES-[REDACTED]')
    }
    if (event.exception?.values) {
      event.exception.values.forEach(ex => {
        if (ex.value) {
          ex.value = ex.value.replace(/RES-\d+/g, 'RES-[REDACTED]')
        }
      })
    }
    return event
  },

  // Filter out noisy errors
  ignoreErrors: [
    // Network errors from user connectivity issues
    'NetworkError',
    'Failed to fetch',
    'Load failed',
    // Browser extensions
    'chrome-extension://',
    'moz-extension://',
  ],
})
