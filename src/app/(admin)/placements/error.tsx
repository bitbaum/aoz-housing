'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import Link from 'next/link'

export default function PlacementsError({
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
    <div className="flex items-center justify-center py-16">
      <div className="max-w-md p-8 bg-white rounded-lg shadow-md text-center">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-red-600 text-xl">!</span>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Etwas ist schiefgelaufen
        </h2>
        <p className="text-gray-600 mb-6 text-sm">
          Beim Laden der Platzierungen ist ein Fehler aufgetreten.
          Bitte versuchen Sie es erneut.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 bg-aoz-primary text-white rounded-md hover:bg-aoz-primary-dark min-h-[44px] transition-colors"
          >
            Erneut versuchen
          </button>
          <Link
            href="/"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 min-h-[44px] inline-flex items-center justify-center transition-colors"
          >
            Zum Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
