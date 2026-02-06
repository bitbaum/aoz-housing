'use client'

import { useState } from 'react'
import { SATISFACTION_EMOJIS, SATISFACTION_LABELS } from '@/lib/constants'

interface SatisfactionRatingProps {
  currentRating?: number | null
}

export function SatisfactionRating({ currentRating }: SatisfactionRatingProps) {
  const [rating, setRating] = useState<number | null>(currentRating || null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRating = async (newRating: number) => {
    if (isSubmitting) return

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/portal/satisfaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: newRating }),
      })

      if (!response.ok) {
        throw new Error('Failed to save')
      }

      setRating(newRating)
      setSubmitted(true)

      // Reset submitted state after 3 seconds
      setTimeout(() => setSubmitted(false), 3000)
    } catch (err) {
      setError('Speichern fehlgeschlagen. Bitte erneut versuchen.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="card md:col-span-2">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Wie gefällt es dir?
      </h2>
      <p className="text-gray-500 mb-4">
        Dein Feedback hilft uns, die Unterkunft zu verbessern
      </p>

      {submitted && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm">
          ✓ Danke für dein Feedback!
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-4">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            onClick={() => handleRating(value)}
            disabled={isSubmitting}
            className={`flex-1 py-4 rounded-lg transition-colors text-2xl min-h-[60px] ${
              rating === value
                ? 'bg-aoz-primary text-white ring-2 ring-aoz-primary ring-offset-2'
                : 'bg-gray-50 hover:bg-aoz-primary hover:text-white'
            } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={SATISFACTION_LABELS[value - 1]}
            aria-label={SATISFACTION_LABELS[value - 1]}
          >
            {SATISFACTION_EMOJIS[value - 1]}
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-400 mt-2 text-center">
        {rating ? `Aktuelle Bewertung: ${SATISFACTION_LABELS[rating - 1]}` : 'Anonym gespeichert'}
      </p>
    </div>
  )
}
