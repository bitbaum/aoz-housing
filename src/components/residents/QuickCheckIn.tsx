'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { createQuickCheckIn } from '@/lib/actions/satisfaction'

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
  { value: 1, emoji: '😢', label: 'Sehr unzufrieden', color: 'border-red-300 hover:border-red-400 peer-checked:border-red-500 peer-checked:bg-red-50' },
  { value: 2, emoji: '😕', label: 'Unzufrieden', color: 'border-orange-300 hover:border-orange-400 peer-checked:border-orange-500 peer-checked:bg-orange-50' },
  { value: 3, emoji: '😐', label: 'Neutral', color: 'border-yellow-300 hover:border-yellow-400 peer-checked:border-yellow-500 peer-checked:bg-yellow-50' },
  { value: 4, emoji: '🙂', label: 'Zufrieden', color: 'border-emerald-300 hover:border-emerald-400 peer-checked:border-emerald-500 peer-checked:bg-emerald-50' },
  { value: 5, emoji: '😊', label: 'Sehr zufrieden', color: 'border-green-300 hover:border-green-400 peer-checked:border-green-500 peer-checked:bg-green-50' },
]

const ROOMMATE_OPTIONS = [
  { value: 1, label: 'Sehr schlecht' },
  { value: 2, label: 'Schlecht' },
  { value: 3, label: 'OK' },
  { value: 4, label: 'Gut' },
  { value: 5, label: 'Sehr gut' },
]

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
          // Reset form after short delay
          setTimeout(() => {
            setSelectedSatisfaction(null)
            setRoommateRelations(null)
            setConcerns('')
            setSavedSuccess(false)
          }, 3000)
        } else {
          setError(result.error || 'Fehler beim Speichern')
        }
      } catch (e) {
        setError('Ein Fehler ist aufgetreten')
      }
    })
  }

  const handleExpandedSubmit = () => {
    if (!selectedSatisfaction) return
    if (needsExplanation && !roommateRelations && !concerns.trim()) {
      setError('Bitte bewerten Sie die Mitbewohner-Beziehung oder beschreiben Sie Ihre Anliegen')
      return
    }
    submitCheckIn(selectedSatisfaction, roommateRelations, concerns)
  }

  // Success state
  if (savedSuccess) {
    return (
      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-2 text-green-700">
          <span className="text-lg">✓</span>
          <span className="font-medium">Check-in gespeichert</span>
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
          <label className="text-sm font-medium text-gray-700">
            Wie geht es Ihnen hier?
          </label>
          {lastSatisfaction && (
            <span className="text-xs text-gray-500">
              Letzter: {SATISFACTION_OPTIONS.find(o => o.value === lastSatisfaction)?.emoji}
            </span>
          )}
        </div>

        <div className="flex gap-2">
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
              />
              <div className={`
                text-center p-2 rounded-lg border-2 transition-all
                ${option.color}
                ${isPending ? 'opacity-50 cursor-wait' : ''}
              `}>
                <div className="text-2xl">{option.emoji}</div>
              </div>
            </label>
          ))}
        </div>

        {isPending && selectedSatisfaction && selectedSatisfaction >= 4 && (
          <p className="text-xs text-gray-500 mt-1 animate-pulse">Speichern...</p>
        )}
      </div>

      {/* Expanded form for low satisfaction */}
      {showExpanded && selectedSatisfaction !== null && selectedSatisfaction < 4 && (
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
          {/* Roommate relations - KEY for matching algorithm */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Wie ist die Beziehung zu Ihren Mitbewohnern?
              {needsExplanation && !concerns.trim() && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </label>
            <div className="flex gap-1">
              {ROOMMATE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRoommateRelations(option.value)}
                  disabled={isPending}
                  className={`
                    flex-1 py-2 px-1 text-xs rounded border transition-all
                    ${roommateRelations === option.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }
                    ${isPending ? 'opacity-50' : ''}
                  `}
                >
                  {option.value}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              1 = Sehr schlecht, 5 = Sehr gut
            </p>
          </div>

          {/* Concerns text - required if very unhappy and no roommate rating */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Was beschäftigt Sie?
              {needsExplanation && !roommateRelations && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </label>
            <textarea
              value={concerns}
              onChange={(e) => setConcerns(e.target.value)}
              placeholder="Gibt es Probleme oder Anliegen?"
              rows={2}
              disabled={isPending}
              className="input text-sm"
            />
          </div>

          {/* Error message */}
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <Link
              href={`/placements/${placementId}/checkin`}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Alle Details erfassen →
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
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleExpandedSubmit}
                disabled={isPending || !canSubmit}
                className="btn-primary text-sm py-1 px-3"
              >
                {isPending ? 'Speichern...' : 'Speichern'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Link to full form */}
      {!showExpanded && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">
            Woche {weeksSinceStart} · {checkInCount} Check-in{checkInCount !== 1 ? 's' : ''} bisher
          </span>
          <Link
            href={`/placements/${placementId}/checkin`}
            className="text-aoz-primary hover:underline"
          >
            Detaillierter Check-in →
          </Link>
        </div>
      )}
    </div>
  )
}
