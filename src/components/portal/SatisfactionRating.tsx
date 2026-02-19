'use client'

import { useState } from 'react'
import { SATISFACTION_EMOJIS, SATISFACTION_LABELS, PORTAL_LABELS } from '@/lib/constants'

interface SatisfactionRatingProps {
  currentRating?: number | null
  lastCheckInDate?: Date | null
}

export function SatisfactionRating({ currentRating, lastCheckInDate }: SatisfactionRatingProps) {
  const [rating, setRating] = useState<number | null>(null)
  const [concerns, setConcerns] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showConcernsField, setShowConcernsField] = useState(false)
  const [forceShowForm, setForceShowForm] = useState(false)

  // Determine if we should prompt (no check-in in the last 7 days)
  const daysSinceLastCheckIn = lastCheckInDate
    ? Math.floor((Date.now() - new Date(lastCheckInDate).getTime()) / (24 * 60 * 60 * 1000))
    : null
  const shouldPrompt = daysSinceLastCheckIn === null || daysSinceLastCheckIn >= 7

  const handleRatingSelect = (newRating: number) => {
    setRating(newRating)
    // Show concerns field for low ratings, hide for good ones
    setShowConcernsField(newRating <= 2)
  }

  const submitCheckIn = async (finalRating: number, finalConcerns: string) => {
    if (isSubmitting) return

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/portal/satisfaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: finalRating,
          concerns: finalConcerns.trim() || undefined,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save')
      }

      setSubmitted(true)
      setShowConcernsField(false)
      setConcerns('')
    } catch {
      setError('Speichern fehlgeschlagen. Bitte erneut versuchen.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitWithConcerns = () => {
    if (rating) {
      submitCheckIn(rating, concerns)
    }
  }

  // Show thank you message if just submitted
  if (submitted) {
    return (
      <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <div className="text-center py-6">
          <span className="text-5xl mb-4 block">✓</span>
          <h2 className="text-xl font-semibold text-green-800 mb-2">
            {PORTAL_LABELS.satisfaction.thankYouTitle}
          </h2>
          <p className="text-green-700">
            {PORTAL_LABELS.satisfaction.thankYouMessage}
          </p>
          {rating && rating <= 2 && concerns && (
            <p className="text-sm text-green-600 mt-3">
              {PORTAL_LABELS.satisfaction.concernsForwarded}
            </p>
          )}
        </div>
      </div>
    )
  }

  // Show subtle indicator if recently checked in
  if (!shouldPrompt && !rating && !forceShowForm) {
    // Format days display — "Heute" instead of "vor 0 Tagen"
    const daysDisplay = daysSinceLastCheckIn === 0
      ? PORTAL_LABELS.satisfaction.today
      : `vor ${daysSinceLastCheckIn} ${daysSinceLastCheckIn === 1 ? 'Tag' : 'Tagen'}`

    return (
      <div className="card bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{PORTAL_LABELS.satisfaction.lastFeedback}</p>
            <div className="flex items-center gap-2 mt-1">
              {currentRating && (
                <span className="text-2xl">{SATISFACTION_EMOJIS[currentRating - 1]}</span>
              )}
              <span className="text-gray-600">
                {daysDisplay}
              </span>
            </div>
          </div>
          <button
            onClick={() => setForceShowForm(true)}
            className="text-sm text-aoz-primary hover:underline min-h-[44px] flex items-center"
          >
            {PORTAL_LABELS.satisfaction.newFeedback}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="card bg-gradient-to-br from-aoz-primary/5 to-aoz-secondary/5 border-aoz-primary/20">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {PORTAL_LABELS.satisfaction.title}
        </h2>
        <p className="text-gray-600">
          {PORTAL_LABELS.satisfaction.subtitle}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm text-center" role="alert" aria-live="polite">
          {error}
        </div>
      )}

      {/* Emoji Buttons */}
      <div className="flex justify-center gap-3 sm:gap-4 mb-4">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            onClick={() => handleRatingSelect(value)}
            disabled={isSubmitting}
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl transition-all text-2xl sm:text-3xl flex items-center justify-center ${
              rating === value
                ? 'bg-aoz-primary text-white ring-2 ring-aoz-primary ring-offset-2 scale-110'
                : 'bg-white hover:bg-aoz-primary/10 hover:scale-105 shadow-sm'
            } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={SATISFACTION_LABELS[value - 1]}
            aria-label={SATISFACTION_LABELS[value - 1]}
          >
            {SATISFACTION_EMOJIS[value - 1]}
          </button>
        ))}
      </div>

      {/* Labels under buttons */}
      <div className="flex justify-center gap-3 sm:gap-4 mb-4">
        <span className="text-xs text-gray-400 w-14 sm:w-16 text-center">Schlecht</span>
        <span className="text-xs text-gray-400 w-14 sm:w-16 text-center"></span>
        <span className="text-xs text-gray-400 w-14 sm:w-16 text-center">Okay</span>
        <span className="text-xs text-gray-400 w-14 sm:w-16 text-center"></span>
        <span className="text-xs text-gray-400 w-14 sm:w-16 text-center">Super</span>
      </div>

      {/* Concerns field for low ratings */}
      {showConcernsField && rating && rating <= 2 && (
        <div className="mt-6 p-4 bg-white rounded-lg border border-orange-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Möchtest du uns mehr erzählen? <span className="text-gray-400">(optional)</span>
          </label>
          <textarea
            value={concerns}
            onChange={(e) => setConcerns(e.target.value)}
            placeholder="Was können wir verbessern? Was beschäftigt dich?"
            className="w-full p-3 border border-gray-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-aoz-primary focus:border-aoz-primary"
            rows={3}
            disabled={isSubmitting}
            maxLength={2000}
          />
          <div className="flex gap-3 mt-3">
            <button
              onClick={handleSubmitWithConcerns}
              disabled={isSubmitting}
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Wird gesendet...' : 'Absenden'}
            </button>
            <button
              onClick={() => submitCheckIn(rating, '')}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 min-h-[44px]"
            >
              Ohne Kommentar absenden
            </button>
          </div>
        </div>
      )}

      {/* Submit button for good ratings (3-5) */}
      {rating && rating >= 3 && (
        <div className="mt-4 text-center">
          <button
            onClick={() => submitCheckIn(rating, '')}
            disabled={isSubmitting}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Wird gesendet...' : 'Feedback absenden'}
          </button>
        </div>
      )}

      <p className="text-xs text-gray-400 mt-4 text-center">
        {PORTAL_LABELS.satisfaction.privacyNote}
      </p>
    </div>
  )
}
