'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  SPOT_TYPE_LABELS,
  SPOT_TYPE_ICONS,
} from '@/lib/config/placement-spots'
import { getScoreLevel, DISPLAY_LIMITS, type ScoreLevel } from '@/lib/config/thresholds'
import { getScoreColorClass, getScoreBgClass } from '@/lib/utils/formatting'
import type { SpotInfo, UnitWithSpots } from '@/lib/types'
import { COMPATIBILITY_SCORE_LABELS } from '@/lib/constants/labels/scores'
import { UI_LABELS } from '@/lib/constants'

// =============================================================================
// TYPES - What data do we need to make an informed transfer decision?
// =============================================================================

/** A resident living in a potential destination unit */
interface ResidentInUnit {
  id: string
  code: string
  /** Pairwise compatibility score with the person being transferred */
  compatibilityScore: number
  /** Key factors explaining the compatibility */
  keyFactors: string[]
}

/** Full compatibility data for a potential destination unit */
interface UnitCompatibilityData {
  /** Apartment-level fit score (aggregate) */
  fitScore: number
  /** Positive factors at apartment level */
  strengths: string[]
  /** Concerns/warnings at apartment level */
  concerns: string[]
  /** Current residents with individual compatibility scores */
  residents: ResidentInUnit[]
}

interface TransferRecommendationsProps {
  /** Units eligible for transfer */
  eligibleUnits: UnitWithSpots[]
  /** Spot types the resident is eligible for */
  eligibleSpotTypes: string[]
  /** Currently selected unit ID */
  selectedUnitId: string
  /** Callback when unit is selected */
  onUnitSelect: (unitId: string) => void
  /** Full compatibility data per unit */
  unitCompatibility?: Record<string, UnitCompatibilityData>
}

// =============================================================================
// STYLING CONSTANTS
// =============================================================================

const SCORE_BADGE_STYLES: Record<ScoreLevel, { bg: string; text: string; border: string; label: string }> = {
  excellent: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', label: COMPATIBILITY_SCORE_LABELS.excellent },
  good: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: COMPATIBILITY_SCORE_LABELS.good },
  moderate: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', label: COMPATIBILITY_SCORE_LABELS.moderate },
  low: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', label: COMPATIBILITY_SCORE_LABELS.low },
  critical: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: COMPATIBILITY_SCORE_LABELS.critical },
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function TransferRecommendations({
  eligibleUnits,
  eligibleSpotTypes,
  selectedUnitId,
  onUnitSelect,
  unitCompatibility = {},
}: TransferRecommendationsProps) {
  const [expandedUnitId, setExpandedUnitId] = useState<string | null>(null)

  // Combine units with their compatibility data and sort by fit score
  const rankedUnits = useMemo(() => {
    return eligibleUnits
      .map(unit => {
        const compat = unitCompatibility[unit.id] || {
          fitScore: 50,
          strengths: [],
          concerns: [],
          residents: [],
        }
        return { ...unit, ...compat }
      })
      .sort((a, b) => b.fitScore - a.fitScore)
  }, [eligibleUnits, unitCompatibility])

  // Show top units, with option to see more
  const [showAll, setShowAll] = useState(false)
  const displayedUnits = showAll ? rankedUnits : rankedUnits.slice(0, DISPLAY_LIMITS.topUnits)
  const hiddenCount = rankedUnits.length - DISPLAY_LIMITS.topUnits

  if (rankedUnits.length === 0) {
    return (
      <div className="text-sm text-orange-600 p-3 bg-orange-50 rounded-lg border border-orange-200">
        Keine Unterkünfte mit geeigneten Plätzen verfügbar.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">
          {rankedUnits.length} Unterkünfte verfügbar · Sortiert nach Passgenauigkeit
        </p>
      </div>

      <div className="space-y-2">
        {displayedUnits.map((unit, index) => {
          const level = getScoreLevel(unit.fitScore)
          const style = SCORE_BADGE_STYLES[level]
          const eligibleSpots = unit.spots.filter(spot => eligibleSpotTypes.includes(spot.type))
          const isSelected = unit.id === selectedUnitId
          const isExpanded = expandedUnitId === unit.id
          const isEmpty = unit.residents.length === 0

          return (
            <div
              key={unit.id}
              className={`rounded-lg border-2 transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-200'
                  : `border-gray-200 hover:border-gray-300 ${style.bg}`
              }`}
            >
              {/* Main clickable area */}
              <button
                type="button"
                onClick={() => onUnitSelect(unit.id)}
                className="w-full text-left p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Left: Unit info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {index === 0 && level === 'excellent' && (
                        <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded font-medium">
                          Empfohlen
                        </span>
                      )}
                      <span className="font-semibold text-gray-900">{unit.code}</span>
                      <span className="text-sm text-gray-500 truncate">{unit.address}</span>
                    </div>

                    {/* Spots available */}
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <span className="font-medium">{eligibleSpots.length} Plätze frei</span>
                    </div>

                    {/* Current residents preview */}
                    <div className="mt-2">
                      {isEmpty ? (
                        <p className="text-xs text-green-600 font-medium">
                          Leer - keine Mitbewohner
                        </p>
                      ) : (
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="text-xs text-gray-500">Bewohner:</span>
                          {unit.residents.slice(0, DISPLAY_LIMITS.dashboardItems).map((resident, i) => (
                            <span
                              key={resident.id}
                              className={`text-xs px-1.5 py-0.5 rounded ${getScoreBgClass(resident.compatibilityScore)}`}
                              title={`${resident.compatibilityScore}% kompatibel`}
                            >
                              {resident.code} ({resident.compatibilityScore}%)
                            </span>
                          ))}
                          {unit.residents.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{unit.residents.length - 3} weitere
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Score */}
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={`text-xl font-bold ${getScoreColorClass(unit.fitScore)}`}>
                      {unit.fitScore}%
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded border ${style.bg} ${style.text} ${style.border}`}>
                      {style.label}
                    </span>
                  </div>
                </div>
              </button>

              {/* Expand/collapse for details */}
              {!isEmpty && (
                <div className="border-t border-gray-200">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setExpandedUnitId(isExpanded ? null : unit.id)
                    }}
                    className="w-full px-3 py-2 text-xs text-gray-500 hover:bg-gray-50 flex items-center justify-center gap-1"
                  >
                    {isExpanded ? '▲ Details ausblenden' : '▼ Details zu Mitbewohnern anzeigen'}
                  </button>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="px-3 pb-3 space-y-3">
                      {/* Apartment-level factors */}
                      {(unit.strengths.length > 0 || unit.concerns.length > 0) && (
                        <div className="p-2 bg-white rounded border border-gray-100">
                          <p className="text-xs font-medium text-gray-700 mb-1">Wohnungs-Faktoren</p>
                          <div className="space-y-1">
                            {unit.strengths.map((s, i) => (
                              <p key={i} className="text-xs text-green-600">+ {s}</p>
                            ))}
                            {unit.concerns.map((c, i) => (
                              <p key={i} className="text-xs text-orange-600">- {c}</p>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Individual resident compatibility */}
                      <div>
                        <p className="text-xs font-medium text-gray-700 mb-2">
                          Kompatibilität mit Mitbewohnern
                        </p>
                        <div className="space-y-2">
                          {unit.residents.map(resident => {
                            const residentLevel = getScoreLevel(resident.compatibilityScore)
                            const residentStyle = SCORE_BADGE_STYLES[residentLevel]
                            return (
                              <div
                                key={resident.id}
                                className={`p-2 rounded border ${residentStyle.bg} ${residentStyle.border}`}
                              >
                                <div className="flex items-center justify-between">
                                  <Link
                                    href={`/residents/${resident.id}`}
                                    className="font-medium text-sm text-gray-900 hover:text-blue-600"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {resident.code}
                                  </Link>
                                  <span className={`text-sm font-bold ${getScoreColorClass(resident.compatibilityScore)}`}>
                                    {resident.compatibilityScore}%
                                  </span>
                                </div>
                                {resident.keyFactors.length > 0 && (
                                  <div className="mt-1 text-xs text-gray-600">
                                    {resident.keyFactors.slice(0, DISPLAY_LIMITS.matchStrengths).map((factor, i) => (
                                      <span key={i}>
                                        {i > 0 && ' · '}
                                        {factor}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Show more button */}
      {!showAll && hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="w-full py-2 text-xs text-gray-500 hover:text-gray-700 border border-dashed border-gray-300 rounded-lg hover:border-gray-400"
        >
          +{hiddenCount} weitere Unterkünfte anzeigen
        </button>
      )}

      {/* Hidden input for form submission */}
      <input type="hidden" name="targetHousingUnitId" value={selectedUnitId} />
    </div>
  )
}

// =============================================================================
// FALLBACK SELECTOR (when no compatibility data available)
// =============================================================================

interface TransferUnitSelectorProps {
  eligibleUnits: UnitWithSpots[]
  eligibleSpotTypes: string[]
  selectedUnitId: string
  onUnitSelect: (unitId: string) => void
  /** Full compatibility data per unit */
  unitCompatibility?: Record<string, UnitCompatibilityData>
}

export function TransferUnitSelector({
  eligibleUnits,
  eligibleSpotTypes,
  selectedUnitId,
  onUnitSelect,
  unitCompatibility,
}: TransferUnitSelectorProps) {
  // If we have compatibility data, use the rich ranked view
  if (unitCompatibility && Object.keys(unitCompatibility).length > 0) {
    return (
      <TransferRecommendations
        eligibleUnits={eligibleUnits}
        eligibleSpotTypes={eligibleSpotTypes}
        selectedUnitId={selectedUnitId}
        onUnitSelect={onUnitSelect}
        unitCompatibility={unitCompatibility}
      />
    )
  }

  // Fallback to simple dropdown when no data available
  return (
    <select
      name="targetHousingUnitId"
      required
      className="input"
      value={selectedUnitId}
      onChange={(e) => onUnitSelect(e.target.value)}
    >
      <option value="">{UI_LABELS.selectPlaceholder}</option>
      {eligibleUnits.map((unit) => {
        const eligibleSpots = unit.spots.filter((spot) =>
          eligibleSpotTypes.includes(spot.type)
        )
        return (
          <option key={unit.id} value={unit.id}>
            {unit.code} - {unit.address} ({eligibleSpots.length} Plätze frei)
          </option>
        )
      })}
    </select>
  )
}

// =============================================================================
// TYPE EXPORTS for use in parent components
// =============================================================================

export type { UnitCompatibilityData, ResidentInUnit }
