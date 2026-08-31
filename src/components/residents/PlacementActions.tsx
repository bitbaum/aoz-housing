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
  /** People-focused support work: staff may check in without being allowed to move housing */
  canWriteCheckIn?: boolean
  /** Housing ops only: transfer / end placement */
  canWritePlacement?: boolean
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
  canWriteCheckIn = true,
  canWritePlacement = true,
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

  if (!canWriteCheckIn && !canWritePlacement) return null

  const eligibleUnits = availableUnits.filter((u) => {
    if (u.id === currentUnitId) return false
    return u.spots.some((spot) => eligibleSpotTypes.includes(spot.type))
  })

  return (
    <div id="placement-actions" className="mt-4 pt-4 border-t scroll-mt-24">
      <h3 className="text-sm font-medium text-ui-muted mb-1">
        {PLACEMENT_ACTIONS_LABELS.actionsTitle}
      </h3>
      {canWritePlacement && (
        <p className="text-xs text-ui-muted mb-3">{PLACEMENT_ACTIONS_LABELS.shortcutHint}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {canWriteCheckIn && (
          <Link
            href={`/placements/${placementId}/checkin`}
            className="btn-primary inline-flex items-center gap-2"
          >
            <span>📋</span>
            {PLACEMENT_ACTIONS_LABELS.checkinBtn}
          </Link>
        )}
        {canWritePlacement && (
          <>
            <button
              type="button"
              className={`btn-outline inline-flex items-center gap-2 ${
                showTransfer ? 'ring-2 ring-brand-secondary/40 bg-brand-secondary/8' : ''
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
                  ? 'ring-2 ring-status-error/40 bg-status-error/8 text-status-error'
                  : 'text-ui-muted hover:text-status-error hover:border-status-error/40'
              }`}
              onClick={() => {
                setShowEnd(!showEnd)
                setShowTransfer(false)
              }}
            >
              <span>⏹️</span>
              {PLACEMENT_ACTIONS_LABELS.endToggleBtn}
            </button>
          </>
        )}
      </div>

      {canWritePlacement && showTransfer && (
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

      {canWritePlacement && showEnd && (
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
