'use client'

import Link from 'next/link'
import { UI_LABELS } from '@/lib/constants'

interface ErrorBoundaryUIProps {
  description: string
  onRetry: () => void
  backHref?: string
  backLabel?: string
}

export function ErrorBoundaryUI({
  description,
  onRetry,
  backHref = '/',
  backLabel = UI_LABELS.errorToDashboard,
}: ErrorBoundaryUIProps) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="max-w-md p-8 bg-white rounded-xl shadow-card text-center">
        <div className="w-12 h-12 bg-status-error/15 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-status-error-text text-xl">!</span>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          {UI_LABELS.errorTitle}
        </h2>
        <p className="text-gray-600 mb-6 text-sm">{description}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={onRetry} className="btn-primary">
            {UI_LABELS.errorRetry}
          </button>
          <Link href={backHref} className="btn-ghost">
            {backLabel}
          </Link>
        </div>
      </div>
    </div>
  )
}
