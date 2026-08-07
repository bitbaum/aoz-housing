'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  AGE_RANGE_LABELS,
  LANGUAGE_LABELS,
  PLACEMENT_PANEL_LABELS,
  PLACEMENT_CONCERN_LABELS,
  UI_LABELS,
  getLabel,
} from '@/lib/constants'
import { getScoreColorClass } from '@/lib/utils'
import { DISPLAY_LIMITS } from '@/lib/config/thresholds'
import type { HousingSpot, CompatibleResident } from './types'

interface PlacementPanelProps {
  isOpen: boolean
  onClose: () => void
  spot: Pick<HousingSpot, 'id' | 'code' | 'label'> | null
  compatibleResidents: CompatibleResident[]
  onPlaceResident: (residentId: string, spotId: string) => Promise<void>
  housingUnitId: string
}

export function PlacementPanel({
  isOpen,
  onClose,
  spot,
  compatibleResidents,
  onPlaceResident,
  housingUnitId,
}: PlacementPanelProps) {
  const [placingResidentId, setPlacingResidentId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (!isOpen || !spot) return null

  const handlePlace = (residentId: string) => {
    setPlacingResidentId(residentId)
    startTransition(async () => {
      await onPlaceResident(residentId, spot.id)
      setPlacingResidentId(null)
      onClose()
    })
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="scrim z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-ui-surface border-l border-ui-border shadow-overlay z-50 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-ui-border flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ui-text">
              {PLACEMENT_PANEL_LABELS.title}
            </h2>
            <p className="text-sm text-ui-muted">
              {spot.label || spot.code}
            </p>
          </div>
          <button
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md text-ui-muted hover:text-ui-muted hover:bg-ui-subtle"
            aria-label={UI_LABELS.close}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {compatibleResidents.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-ui-muted mb-4">
                {PLACEMENT_PANEL_LABELS.noResidents}
              </p>
              <Link href="/residents/new" className="btn-primary text-sm">
                {PLACEMENT_PANEL_LABELS.addResident}
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-ui-muted mb-4">
                {compatibleResidents.length} {PLACEMENT_PANEL_LABELS.foundSuffix}
              </p>
              {compatibleResidents.map((match) => (
                <ResidentRow
                  key={match.resident.id}
                  match={match}
                  onPlace={() => handlePlace(match.resident.id)}
                  isPlacing={placingResidentId === match.resident.id}
                  disabled={isPending}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-ui-border">
          <Link
            href={`/matching?unit=${housingUnitId}`}
            className="btn-outline w-full text-center"
          >
            {PLACEMENT_PANEL_LABELS.advancedMatching}
          </Link>
        </div>
      </div>
    </>
  )
}

function ResidentRow({
  match,
  onPlace,
  isPlacing,
  disabled,
}: {
  match: CompatibleResident
  onPlace: () => void
  isPlacing: boolean
  disabled: boolean
}) {
  const { resident, fitScore, strengths, concerns } = match
  const hasBlockingConcerns = concerns.some(
    (c) => c === PLACEMENT_CONCERN_LABELS.wheelchairRequired || c === PLACEMENT_CONCERN_LABELS.groundFloorRequired
  )

  const borderColor = hasBlockingConcerns
    ? 'border-ui-border'
    : concerns.length > 0
      ? 'border-status-warning/30'
      : fitScore >= 70
        ? 'border-status-success/30'
        : 'border-ui-border'

  const bgColor = hasBlockingConcerns
    ? 'bg-ui-subtle'
    : concerns.length > 0
      ? 'bg-status-warning/10'
      : fitScore >= 70
        ? 'bg-status-success/8'
        : 'bg-ui-subtle'

  return (
    <div className={`p-4 rounded-lg border ${borderColor} ${bgColor}`}>
      <div className="flex items-start justify-between gap-4">
        {/* Left: Resident info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="avatar flex-shrink-0">
            {resident.code.slice(-3)}
          </div>
          <div className="min-w-0">
            <Link
              href={`/residents/${resident.id}`}
              className="font-medium text-ui-text hover:text-brand-primary truncate block"
            >
              {resident.code}
            </Link>
            <p className="text-sm text-ui-muted truncate">
              {getLabel(AGE_RANGE_LABELS, resident.ageRange)} ·{' '}
              {resident.languages?.slice(0, DISPLAY_LIMITS.languagePreview).map((l) => getLabel(LANGUAGE_LABELS, l)).join(', ')}
            </p>
          </div>
        </div>

        {/* Right: Score and action */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <span
            className={`text-lg font-bold ${getScoreColorClass(fitScore)}`}
            title={`${PLACEMENT_PANEL_LABELS.compatibilityTitle} ${fitScore}%`}
          >
            {fitScore}%
          </span>
          {hasBlockingConcerns ? (
            <span className="text-xs text-ui-muted px-2 py-1 bg-ui-border rounded">
              {PLACEMENT_PANEL_LABELS.blocked}
            </span>
          ) : (
            <button
              onClick={onPlace}
              disabled={disabled}
              className={`btn-primary text-sm ${
                fitScore >= 70
                  ? ''
                  : fitScore >= 50
                    ? 'bg-status-warning hover:bg-status-warning/90'
                    : 'bg-ui-muted hover:bg-ui-muted/90'
              } disabled:opacity-50`}
            >
              {isPlacing ? PLACEMENT_PANEL_LABELS.placing : PLACEMENT_PANEL_LABELS.place}
            </button>
          )}
        </div>
      </div>

      {/* Concerns or strengths */}
      {concerns.length > 0 && !hasBlockingConcerns && (
        <p className="text-xs text-status-warning-text mt-2">
          ⚠️ {concerns[0]}
        </p>
      )}
      {concerns.length === 0 && strengths.length > 0 && (
        <p className="text-xs text-status-success-text mt-2">
          ✓ {strengths[0]}
        </p>
      )}
    </div>
  )
}

export default PlacementPanel
