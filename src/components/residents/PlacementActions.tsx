'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PLACEMENT_ACTIONS_LABELS } from '@/lib/constants'
import { TransferForm } from './TransferForm'
import { EndPlacementForm, type RecentIncident } from './EndPlacementForm'
import type { UnitCompatibilityData } from './TransferRecommendations'
import type { UnitWithSpots } from '@/lib/types'

interface PlacementActionsProps {
  placementId: string
  residentId: string
  currentUnitId: string
  hasMedicalDocumentation: boolean
  availableUnits: UnitWithSpots[]
  eligibleSpotTypes: string[]
  /** Full compatibility data per unit (enables algorithm-powered transfer recommendations) */
  unitCompatibility?: Record<string, UnitCompatibilityData>
  /** Recent incidents for linking to conflict end reason */
  recentIncidents?: RecentIncident[]
  /** Initial compatibility score at placement time (for predictability question) */
  initialCompatibilityScore?: number | null
  /** Optionally open one action panel by default */
  initialAction?: 'transfer' | 'end'
}

export function PlacementActions({
  placementId,
  residentId,
  currentUnitId,
  hasMedicalDocumentation,
  availableUnits,
  eligibleSpotTypes,
  unitCompatibility,
  recentIncidents = [],
  initialCompatibilityScore,
  initialAction,
}: PlacementActionsProps) {
  const [showTransfer, setShowTransfer] = useState(initialAction === 'transfer')
  const [showEnd, setShowEnd] = useState(initialAction === 'end')
  const [selectedUnitId, setSelectedUnitId] = useState<string>('')
  const [selectedEndReason, setSelectedEndReason] = useState<string>('')

  useEffect(() => {
    const onShortcut = (event: KeyboardEvent) => {
      if (!(event.altKey && event.shiftKey)) return

      if (event.key.toLowerCase() === 'v') {
        event.preventDefault()
        setShowTransfer(true)
        setShowEnd(false)
      }

      if (event.key.toLowerCase() === 'e') {
        event.preventDefault()
        setShowEnd(true)
        setShowTransfer(false)
      }
    }

    window.addEventListener('keydown', onShortcut)
    return () => window.removeEventListener('keydown', onShortcut)
  }, [])

  const eligibleUnits = availableUnits.filter((u) => {
    if (u.id === currentUnitId) return false
    return u.spots.some((spot) => eligibleSpotTypes.includes(spot.type))
  })

  return (
    <div id="placement-actions" className="mt-4 pt-4 border-t scroll-mt-24">
      <h3 className="text-sm font-medium text-gray-700 mb-1">{PLACEMENT_ACTIONS_LABELS.actionsTitle}</h3>
      <p className="text-xs text-gray-500 mb-3">
        {PLACEMENT_ACTIONS_LABELS.shortcutHint}
      </p>
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/placements/${placementId}/checkin`}
          className="btn-primary inline-flex items-center gap-2"
        >
          <span>📋</span>
          {PLACEMENT_ACTIONS_LABELS.checkinBtn}
        </Link>
        <button
          type="button"
          className={`btn-outline inline-flex items-center gap-2 ${
            showTransfer ? 'ring-2 ring-blue-300 bg-blue-50' : ''
          }`}
          onClick={() => {
            setShowTransfer(!showTransfer)
            setShowEnd(false)
          }}
        >
          <span>🔄</span>
          {PLACEMENT_ACTIONS_LABELS.transferToggleBtn}
        </button>
        <button
          type="button"
          className={`btn-outline inline-flex items-center gap-2 ${
            showEnd
              ? 'ring-2 ring-red-300 bg-red-50 text-red-600'
              : 'text-gray-500 hover:text-red-600 hover:border-red-300'
          }`}
          onClick={() => {
            setShowEnd(!showEnd)
            setShowTransfer(false)
          }}
        >
          <span>⏹️</span>
          {PLACEMENT_ACTIONS_LABELS.endToggleBtn}
        </button>
      </div>

      {showTransfer && (
        <TransferForm
          placementId={placementId}
          residentId={residentId}
          eligibleUnits={eligibleUnits}
          eligibleSpotTypes={eligibleSpotTypes}
          hasMedicalDocumentation={hasMedicalDocumentation}
          unitCompatibility={unitCompatibility}
          selectedUnitId={selectedUnitId}
          onUnitSelect={setSelectedUnitId}
          onClose={() => setShowTransfer(false)}
        />
      )}

      {showEnd && (
        <EndPlacementForm
          placementId={placementId}
          residentId={residentId}
          recentIncidents={recentIncidents}
          initialCompatibilityScore={initialCompatibilityScore}
          selectedEndReason={selectedEndReason}
          onReasonChange={setSelectedEndReason}
          onClose={() => setShowEnd(false)}
        />
      )}
    </div>
  )
}
