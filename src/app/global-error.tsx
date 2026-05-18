'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="de">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-ui-subtle">
          <div className="max-w-md p-8 bg-ui-surface rounded-lg shadow-card text-center">
            <h2 className="text-xl font-semibold text-ui-text mb-4">
              Ein Fehler ist aufgetreten
            </h2>
            <p className="text-ui-muted mb-6">
              Bitte versuchen Sie es erneut. Falls das Problem bestehen bleibt,
              kontaktieren Sie den Support.
            </p>
            <button
              onClick={reset}
              className="btn-primary px-6"
            >
              Erneut versuchen
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
