'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import { ErrorBoundaryUI } from '@/components/ui/ErrorBoundaryUI'
import { UI_LABELS } from '@/lib/constants'

export default function ChoresError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return <ErrorBoundaryUI description={UI_LABELS.errorChoresDesc} onRetry={reset} />
}
