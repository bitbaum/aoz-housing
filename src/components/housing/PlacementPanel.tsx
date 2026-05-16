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
        className="fixed inset-0 bg-black/40 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-card-hover z-50 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {PLACEMENT_PANEL_LABELS.title}
            </h2>
            <p className="text-sm text-gray-500">
              {spot.label || spot.code}
            </p>
          </div>
          <button
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
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
              <p className="text-gray-500 mb-4">
                {PLACEMENT_PANEL_LABELS.noResidents}
              </p>
              <Link href="/residents/new" className="btn-primary text-sm">
                {PLACEMENT_PANEL_LABELS.addResident}
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 mb-4">
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
        <div className="px-6 py-4 border-t border-gray-100">
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
    ? 'border-gray-200'
    : concerns.length > 0
      ? 'border-orange-200'
      : fitScore >= 70
        ? 'border-green-200'
        : 'border-gray-200'

  const bgColor = hasBlockingConcerns
    ? 'bg-gray-50'
    : concerns.length > 0
      ? 'bg-status-warning/10'
      : fitScore >= 70
        ? 'bg-status-success/8'
        : 'bg-gray-50'

  return (
    <div className={`p-4 rounded-lg border ${borderColor} ${bgColor}`}>
      <div className="flex items-start justify-between gap-4">
        {/* Left: Resident info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-aoz-primary text-white rounded-full flex items-center justify-center font-medium flex-shrink-0">
            {resident.code.slice(-3)}
          </div>
          <div className="min-w-0">
            <Link
              href={`/residents/${resident.id}`}
              className="font-medium text-gray-900 hover:text-aoz-primary truncate block"
            >
              {resident.code}
            </Link>
            <p className="text-sm text-gray-500 truncate">
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
            <span className="text-xs text-gray-500 px-2 py-1 bg-gray-200 rounded">
              {PLACEMENT_PANEL_LABELS.blocked}
            </span>
          ) : (
            <button
              onClick={onPlace}
              disabled={disabled}
              className={`btn-primary text-sm px-3 py-1.5 ${
                fitScore >= 70
                  ? ''
                  : fitScore >= 50
                    ? 'bg-status-warning hover:bg-status-warning/90'
                    : 'bg-gray-500 hover:bg-gray-600'
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
