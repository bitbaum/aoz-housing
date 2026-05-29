import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Only enable in production
  enabled: process.env.NODE_ENV === 'production',

  // Tag every event with the deploy SHA + Vercel env so Sentry can group by
  // release and distinguish preview vs production.
  release: process.env.SENTRY_RELEASE || process.env.VERCEL_GIT_COMMIT_SHA,
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV,

  // Performance monitoring — sample 10% of transactions
  tracesSampleRate: 0.1,

  // Strip potential PII from error messages
  beforeSend(event) {
    function redactPII(text: string): string {
      return text
        .replace(/RES-\d+/g, 'RES-[REDACTED]')
        .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]')
    }

    if (event.message) {
      event.message = redactPII(event.message)
    }
    if (event.exception?.values) {
      event.exception.values.forEach(ex => {
        if (ex.value) {
          ex.value = redactPII(ex.value)
        }
      })
    }
    return event
  },
})
