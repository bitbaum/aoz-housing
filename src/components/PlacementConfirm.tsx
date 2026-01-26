'use client'

import { useState, useTransition } from 'react'

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
    ? 'bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700'
    : 'btn-primary text-sm px-3 py-1'

  const buttonLabel = hasConflicts
    ? 'Blockiert'
    : fitScore < 50
    ? 'Platzieren (niedrige Kompatibilität)'
    : 'Platzieren'

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Platzierung bestätigen
              </h3>
            </div>

            {/* Content */}
            <div className="px-6 py-4 space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-2">Sie sind dabei zu platzieren:</p>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-700">Bewohner:</span>
                    <span className="text-sm text-gray-900">{residentCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-700">Unterkunft:</span>
                    <span className="text-sm text-gray-900">{unitCode}</span>
                  </div>
                  {spotLabel && (
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-700">Platz:</span>
                      <span className="text-sm text-gray-900">{spotLabel}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-700">Kompatibilität:</span>
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
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <p className="text-sm text-orange-800 font-medium">
                    ⚠️ Niedrige Kompatibilität
                  </p>
                  <p className="text-xs text-orange-700 mt-1">
                    Diese Platzierung hat eine niedrige Kompatibilitätsbewertung. Bitte stellen
                    Sie sicher, dass dies die beste verfügbare Option ist.
                  </p>
                </div>
              )}

              {/* Show conflicts if any */}
              {conflicts.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800 font-medium mb-2">
                    Beachten Sie folgende Punkte:
                  </p>
                  <ul className="text-xs text-yellow-700 space-y-1">
                    {conflicts.map((conflict, i) => (
                      <li key={i}>• {conflict}</li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="text-sm text-gray-600">
                Diese Aktion wird den Bewohner platzieren und den Platz als belegt markieren.
                Möchten Sie fortfahren?
              </p>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setIsOpen(false)}
                disabled={isPending}
                className="btn-outline"
              >
                Abbrechen
              </button>
              <button
                onClick={handleConfirm}
                disabled={isPending}
                className={
                  fitScore < 50
                    ? 'bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50'
                    : 'btn-primary disabled:opacity-50'
                }
              >
                {isPending ? 'Wird platziert...' : 'Jetzt platzieren'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
