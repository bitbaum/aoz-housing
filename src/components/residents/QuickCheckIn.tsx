'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { createQuickCheckIn } from '@/lib/actions/satisfaction'
import { showToast } from '@/components/ui/Toast'
import { UI_LABELS, SATISFACTION_SURVEY_LABELS, QUICK_CHECKIN_LABELS } from '@/lib/constants/labels'

interface QuickCheckInProps {
  placementId: string
  residentId: string
  /** Number of existing check-ins (to determine type) */
  checkInCount: number
  /** Weeks since placement started */
  weeksSinceStart: number
  /** Last satisfaction score (for trend indicator) */
  lastSatisfaction?: number
}

const SATISFACTION_OPTIONS = [
  { value: 1, emoji: '😢', label: QUICK_CHECKIN_LABELS.satisfactionLabels[1], color: 'border-score-critical/50 hover:border-score-critical/70 peer-checked:border-score-critical peer-checked:bg-score-critical/8' },
  { value: 2, emoji: '😕', label: QUICK_CHECKIN_LABELS.satisfactionLabels[2], color: 'border-score-low/50 hover:border-score-low/70 peer-checked:border-score-low peer-checked:bg-score-low/8' },
  { value: 3, emoji: '😐', label: QUICK_CHECKIN_LABELS.satisfactionLabels[3], color: 'border-score-medium/50 hover:border-score-medium/70 peer-checked:border-score-medium peer-checked:bg-score-medium/8' },
  { value: 4, emoji: '🙂', label: QUICK_CHECKIN_LABELS.satisfactionLabels[4], color: 'border-score-good/50 hover:border-score-good/70 peer-checked:border-score-good peer-checked:bg-score-good/8' },
  { value: 5, emoji: '😊', label: QUICK_CHECKIN_LABELS.satisfactionLabels[5], color: 'border-score-excellent/50 hover:border-score-excellent/70 peer-checked:border-score-excellent peer-checked:bg-score-excellent/8' },
]

const ROOMMATE_OPTIONS = [1, 2, 3, 4, 5].map((v) => ({
  value: v,
  label: QUICK_CHECKIN_LABELS.roommateLabels[v],
}))


export function QuickCheckIn({
  placementId,
  residentId,
  checkInCount,
  weeksSinceStart,
  lastSatisfaction,
}: QuickCheckInProps) {
  const [isPending, startTransition] = useTransition()
  const [selectedSatisfaction, setSelectedSatisfaction] = useState<number | null>(null)
  const [roommateRelations, setRoommateRelations] = useState<number | null>(null)
  const [concerns, setConcerns] = useState('')
  const [showExpanded, setShowExpanded] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Determine if we need more details based on satisfaction
  const needsRoommateQuestion = selectedSatisfaction !== null && selectedSatisfaction < 4
  const needsExplanation = selectedSatisfaction !== null && selectedSatisfaction <= 2
  const canSubmit = selectedSatisfaction !== null && (
    selectedSatisfaction >= 4 || // Happy = can submit immediately
    roommateRelations !== null || // Has roommate rating
    concerns.trim().length > 0 // Has concerns text
  )

  const handleSatisfactionSelect = (value: number) => {
    setSelectedSatisfaction(value)
    setError(null)
    setSavedSuccess(false)

    // If happy (4-5), submit immediately
    if (value >= 4) {
      submitCheckIn(value, null, '')
    } else {
      // Need more info - expand the form
      setShowExpanded(true)
    }
  }

  const submitCheckIn = (satisfaction: number, roommates: number | null, concernsText: string) => {
    startTransition(async () => {
      try {
        const result = await createQuickCheckIn({
          placementId,
          overallSatisfaction: satisfaction,
          roommateRelations: roommates,
          concerns: concernsText.trim() || undefined,
          checkInType: checkInCount === 0 ? 'INITIAL' : 'REGULAR',
          weekNumber: weeksSinceStart,
        })

        if (result.success) {
          setSavedSuccess(true)
          setShowExpanded(false)
          showToast('success', QUICK_CHECKIN_LABELS.toastSuccess)
          // Reset form after short delay
          setTimeout(() => {
            setSelectedSatisfaction(null)
            setRoommateRelations(null)
            setConcerns('')
            setSavedSuccess(false)
          }, 3000)
        } else {
          setError(result.error || QUICK_CHECKIN_LABELS.errorSaving)
        }
      } catch (e) {
        setError(QUICK_CHECKIN_LABELS.errorGeneric)
      }
    })
  }

  const handleExpandedSubmit = () => {
    if (!selectedSatisfaction) return
    if (needsExplanation && !roommateRelations && !concerns.trim()) {
      setError(QUICK_CHECKIN_LABELS.errorValidation)
      return
    }
    submitCheckIn(selectedSatisfaction, roommateRelations, concerns)
  }

  // Success state
  if (savedSuccess) {
    return (
      <div className="p-3 bg-status-success/10 border border-status-success/25 rounded-lg">
        <div className="flex items-center gap-2 text-status-success-text">
          <span className="text-lg">✓</span>
          <span className="font-medium">{QUICK_CHECKIN_LABELS.successSaved}</span>
          <span className="text-2xl ml-2">
            {SATISFACTION_OPTIONS.find(o => o.value === selectedSatisfaction)?.emoji}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Quick satisfaction selection */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-ui-muted">
            {QUICK_CHECKIN_LABELS.mainLabel}
          </label>
          {lastSatisfaction && (
            <span className="text-xs text-ui-muted">
              {QUICK_CHECKIN_LABELS.lastPrefix}{SATISFACTION_OPTIONS.find(o => o.value === lastSatisfaction)?.emoji}
            </span>
          )}
        </div>

        <div className="flex gap-2" role="radiogroup" aria-label={SATISFACTION_SURVEY_LABELS.groupLabel}>
          {SATISFACTION_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex-1 cursor-pointer"
              title={option.label}
            >
              <input
                type="radio"
                name="quickSatisfaction"
                value={option.value}
                checked={selectedSatisfaction === option.value}
                onChange={() => handleSatisfactionSelect(option.value)}
                disabled={isPending}
                className="sr-only peer"
                aria-label={`${option.label} (${option.value} von 5)`}
              />
              <div className={`
                text-center p-2 rounded-lg border-2 transition-all
                ${option.color}
                ${isPending ? 'opacity-50 cursor-wait' : ''}
              `}>
                <div className="text-2xl" aria-hidden="true">{option.emoji}</div>
              </div>
            </label>
          ))}
        </div>

        {isPending && selectedSatisfaction && selectedSatisfaction >= 4 && (
          <p className="text-xs text-ui-muted mt-1 animate-pulse">{QUICK_CHECKIN_LABELS.savingState}</p>
        )}
      </div>

      {/* Expanded form for low satisfaction */}
      {showExpanded && selectedSatisfaction !== null && selectedSatisfaction < 4 && (
        <div className="p-3 bg-ui-subtle rounded-lg border border-ui-border space-y-3" aria-live="polite">
          {/* Roommate relations - KEY for matching algorithm */}
          <div>
            <label id="roommate-label" className="text-sm font-medium text-ui-muted block mb-1">
              {QUICK_CHECKIN_LABELS.roommateLabel}
              {needsExplanation && !concerns.trim() && (
                <span className="text-status-error-text ml-1" aria-label={UI_LABELS.required}>*</span>
              )}
            </label>
            <div className="flex gap-1" role="radiogroup" aria-labelledby="roommate-label">
              {ROOMMATE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={roommateRelations === option.value}
                  aria-label={`${option.label} (${option.value} von 5)`}
                  onClick={() => setRoommateRelations(option.value)}
                  disabled={isPending}
                  className={`
                    flex-1 py-2 px-1 text-xs rounded border transition-all
                    ${roommateRelations === option.value
                      ? 'border-aoz-secondary bg-aoz-secondary/8 text-aoz-secondary font-medium'
                      : 'border-ui-border hover:border-ui-border-strong text-ui-muted'
                    }
                    ${isPending ? 'opacity-50' : ''}
                  `}
                >
                  {option.value}
                </button>
              ))}
            </div>
            <p className="text-xs text-ui-muted mt-1">
              {QUICK_CHECKIN_LABELS.roommateScaleHint}
            </p>
          </div>

          {/* Concerns text - required if very unhappy and no roommate rating */}
          <div>
            <label htmlFor="concerns-input" className="text-sm font-medium text-ui-muted block mb-1">
              {QUICK_CHECKIN_LABELS.concernsLabel}
              {needsExplanation && !roommateRelations && (
                <span className="text-status-error-text ml-1" aria-label={UI_LABELS.required}>*</span>
              )}
            </label>
            <textarea
              id="concerns-input"
              value={concerns}
              onChange={(e) => setConcerns(e.target.value)}
              placeholder={QUICK_CHECKIN_LABELS.concernsPlaceholder}
              rows={2}
              disabled={isPending}
              aria-required={needsExplanation && !roommateRelations}
              className="input text-sm"
            />
          </div>

          {/* Error message */}
          {error && (
            <p className="text-sm text-status-error-text" role="alert" aria-live="polite">{error}</p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <Link
              href={`/placements/${placementId}/checkin`}
              className="text-xs text-ui-muted hover:text-ui-muted"
            >
              {QUICK_CHECKIN_LABELS.fullFormLink}
            </Link>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowExpanded(false)
                  setSelectedSatisfaction(null)
                  setRoommateRelations(null)
                  setConcerns('')
                  setError(null)
                }}
                disabled={isPending}
                className="btn-outline text-sm py-1 px-3"
              >
                {UI_LABELS.cancel}
              </button>
              <button
                type="button"
                onClick={handleExpandedSubmit}
                disabled={isPending || !canSubmit}
                className="btn-primary text-sm py-1 px-3"
              >
                {isPending ? QUICK_CHECKIN_LABELS.savingState : QUICK_CHECKIN_LABELS.saveBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Link to full form */}
      {!showExpanded && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-ui-muted">
            {QUICK_CHECKIN_LABELS.statsLine(weeksSinceStart, checkInCount)}
          </span>
          <Link
            href={`/placements/${placementId}/checkin`}
            className="text-aoz-primary hover:underline"
          >
            {QUICK_CHECKIN_LABELS.detailedLink}
          </Link>
        </div>
      )}
    </div>
  )
}
