'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import { ErrorBoundaryUI } from '@/components/ui'
import { useT } from '@/lib/i18n/LocaleProvider'

export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useT()

  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <ErrorBoundaryUI
      description={t('error.portalMessage')}
      onRetry={reset}
      backHref="/portal"
      backLabel={t('error.portalHome')}
    />
  )
}
