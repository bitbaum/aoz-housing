import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Only enable in production
  enabled: process.env.NODE_ENV === 'production',

  // Tag every event with the deploy release + environment so Sentry can
  // group by release and distinguish environments.
  release: process.env.SENTRY_RELEASE,
  environment: process.env.NODE_ENV,

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
      event.exception.values.forEach((ex) => {
        if (ex.value) {
          ex.value = redactPII(ex.value)
        }
      })
    }
    return event
  },
})
