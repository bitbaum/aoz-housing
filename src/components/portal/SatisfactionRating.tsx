'use client'

import { useState } from 'react'
import { SATISFACTION_EMOJIS, SATISFACTION_LABELS, SATISFACTION_SURVEY_LABELS, PORTAL_LABELS } from '@/lib/constants'

interface SatisfactionRatingProps {
  currentRating?: number | null
  lastCheckInDate?: Date | null
}

export function SatisfactionRating({ currentRating, lastCheckInDate }: SatisfactionRatingProps) {
  const [rating, setRating] = useState<number | null>(null)
  const [concerns, setConcerns] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submittedWithConcerns, setSubmittedWithConcerns] = useState(false)
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

      setSubmittedWithConcerns(!!finalConcerns.trim())
      setSubmitted(true)
      setShowConcernsField(false)
      setConcerns('')
    } catch {
      setError(SATISFACTION_SURVEY_LABELS.saveFailed)
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
      <div className="card bg-status-success/10 border-status-success/25">
        <div className="text-center py-6">
          <span className="text-5xl mb-4 block">✓</span>
          <h2 className="text-xl font-semibold text-status-success-text mb-2">
            {PORTAL_LABELS.satisfaction.thankYouTitle}
          </h2>
          <p className="text-status-success-text">
            {PORTAL_LABELS.satisfaction.thankYouMessage}
          </p>
          {rating && rating <= 2 && submittedWithConcerns && (
            <p className="text-sm text-status-success mt-3">
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
      : `vor ${daysSinceLastCheckIn} ${daysSinceLastCheckIn === 1 ? SATISFACTION_SURVEY_LABELS.day : SATISFACTION_SURVEY_LABELS.days}`

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
        <div className="mb-4 p-3 bg-status-error/8 text-status-error-text rounded-lg text-sm text-center" role="alert" aria-live="polite">
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
        <span className="text-xs text-gray-500 w-14 sm:w-16 text-center">{SATISFACTION_SURVEY_LABELS.ratings.bad}</span>
        <span className="text-xs text-gray-500 w-14 sm:w-16 text-center"></span>
        <span className="text-xs text-gray-500 w-14 sm:w-16 text-center">{SATISFACTION_SURVEY_LABELS.ratings.okay}</span>
        <span className="text-xs text-gray-500 w-14 sm:w-16 text-center"></span>
        <span className="text-xs text-gray-500 w-14 sm:w-16 text-center">{SATISFACTION_SURVEY_LABELS.ratings.great}</span>
      </div>

      {/* Concerns field for low ratings */}
      {showConcernsField && rating && rating <= 2 && (
        <div className="mt-6 p-4 bg-white rounded-lg border border-orange-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {SATISFACTION_SURVEY_LABELS.commentPrompt} <span className="text-gray-500">{SATISFACTION_SURVEY_LABELS.optional}</span>
          </label>
          <textarea
            value={concerns}
            onChange={(e) => setConcerns(e.target.value)}
            placeholder={SATISFACTION_SURVEY_LABELS.commentPlaceholder}
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
              {isSubmitting ? SATISFACTION_SURVEY_LABELS.submitting : SATISFACTION_SURVEY_LABELS.submit}
            </button>
            <button
              onClick={() => submitCheckIn(rating, '')}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 min-h-[44px]"
            >
              {SATISFACTION_SURVEY_LABELS.submitWithoutComment}
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
            {isSubmitting ? SATISFACTION_SURVEY_LABELS.submitting : SATISFACTION_SURVEY_LABELS.submitFeedback}
          </button>
        </div>
      )}

      <p className="text-xs text-gray-500 mt-4 text-center">
        {PORTAL_LABELS.satisfaction.privacyNote}
      </p>
    </div>
  )
}
