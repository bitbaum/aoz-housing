'use client'

import { useState, useTransition } from 'react'
import { MATCHING_LABELS, PLACEMENT_CONFIRM_LABELS } from '@/lib/constants'

interface PlacementConfirmProps {
  residentCode: string
  unitCode: string
  spotLabel?: string
  fitScore: number
  hasConflicts: boolean
  conflicts?: string[]
  action: (formData: FormData) => Promise<void>
  formData: Record<string, string | number | boolean>
  disabled?: boolean
}

export function PlacementConfirm({
  residentCode,
  unitCode,
  spotLabel,
  fitScore,
  hasConflicts,
  conflicts = [],
  action,
  formData,
  disabled = false,
}: PlacementConfirmProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleConfirm = () => {
    startTransition(async () => {
      const form = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        form.append(key, String(value))
      })
      await action(form)
      setIsOpen(false)
    })
  }

  const buttonClass = hasConflicts
    ? 'opacity-50 cursor-not-allowed bg-gray-400 text-white px-3 py-1 rounded text-sm'
    : fitScore < 50
    ? 'bg-status-warning text-white px-3 py-1 rounded text-sm hover:bg-status-warning/90'
    : 'btn-primary text-sm px-3 py-1'

  const buttonLabel = hasConflicts
    ? MATCHING_LABELS.blocked
    : fitScore < 50
    ? MATCHING_LABELS.placeLowCompat
    : MATCHING_LABELS.place

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        disabled={disabled || hasConflicts}
        className={buttonClass}
      >
        {buttonLabel}
      </button>

      {/* Confirmation Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-xl shadow-card-hover max-w-lg w-full mx-4">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">
                {PLACEMENT_CONFIRM_LABELS.title}
              </h3>
            </div>

            {/* Content */}
            <div className="px-6 py-4 space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-2">{PLACEMENT_CONFIRM_LABELS.prompt}</p>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-700">{PLACEMENT_CONFIRM_LABELS.resident}</span>
                    <span className="text-sm text-gray-900">{residentCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-700">{PLACEMENT_CONFIRM_LABELS.unit}</span>
                    <span className="text-sm text-gray-900">{unitCode}</span>
                  </div>
                  {spotLabel && (
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-700">{PLACEMENT_CONFIRM_LABELS.spot}</span>
                      <span className="text-sm text-gray-900">{spotLabel}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-700">{PLACEMENT_CONFIRM_LABELS.compatibility}</span>
                    <span
                      className={`text-sm font-bold ${
                        fitScore >= 70
                          ? 'text-green-600'
                          : fitScore >= 50
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}
                    >
                      {fitScore}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Warning for low compatibility */}
              {fitScore < 50 && (
                <div className="bg-status-warning/10 border border-status-warning/25 rounded-lg p-3">
                  <p className="text-sm text-amber-900 font-medium">
                    ⚠️ {PLACEMENT_CONFIRM_LABELS.lowCompatWarning}
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    {PLACEMENT_CONFIRM_LABELS.lowCompatMessage}
                  </p>
                </div>
              )}

              {/* Show conflicts if any */}
              {conflicts.length > 0 && (
                <div className="bg-status-warning/8 border border-status-warning/20 rounded-lg p-3">
                  <p className="text-sm text-amber-800 font-medium mb-2">
                    {PLACEMENT_CONFIRM_LABELS.notePoints}
                  </p>
                  <ul className="text-xs text-amber-700 space-y-1">
                    {conflicts.map((conflict, i) => (
                      <li key={i}>• {conflict}</li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="text-sm text-gray-600">
                {PLACEMENT_CONFIRM_LABELS.confirmMessage}
              </p>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setIsOpen(false)}
                disabled={isPending}
                className="btn-outline"
              >
                {PLACEMENT_CONFIRM_LABELS.cancel}
              </button>
              <button
                onClick={handleConfirm}
                disabled={isPending}
                className={
                  fitScore < 50
                    ? 'bg-status-warning text-white px-4 py-2 rounded-lg hover:bg-status-warning/90 disabled:opacity-50'
                    : 'btn-primary disabled:opacity-50'
                }
              >
                {isPending ? PLACEMENT_CONFIRM_LABELS.placing : PLACEMENT_CONFIRM_LABELS.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
