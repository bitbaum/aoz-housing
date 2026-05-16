'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import { ErrorBoundaryUI } from '@/components/ui'
import { PORTAL_LABELS } from '@/lib/constants'

export default function PortalError({
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
    <ErrorBoundaryUI
      description={PORTAL_LABELS.error.message}
      onRetry={reset}
      backHref="/portal"
      backLabel={PORTAL_LABELS.error.home}
    />
  )
}
