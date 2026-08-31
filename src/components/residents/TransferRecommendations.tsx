'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { getScoreLevel, DISPLAY_LIMITS, type ScoreLevel } from '@/lib/config/thresholds'
import { getScoreColorClass, getScoreBgClass } from '@/lib/utils/formatting'
import { SCORE_TOKENS } from '@/lib/config/ui-tokens'
import type { UnitWithSpots } from '@/lib/types'
import {
  COMPATIBILITY_SCORE_LABELS,
  TRANSFER_RECOMMENDATIONS_LABELS,
  PLACEMENT_ACTIONS_LABELS,
} from '@/lib/constants'
import { residentInitials, residentName } from '@/lib/utils/resident-name'

// =============================================================================
// TYPES - What data do we need to make an informed transfer decision?
// =============================================================================

/** A resident living in a potential destination unit */
interface ResidentInUnit {
  id: string
  code: string
  displayName: string | null
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

const SCORE_CARD_BG: Record<ScoreLevel, string> = {
  excellent: 'bg-score-excellent/8',
  good: 'bg-score-good/8',
  moderate: 'bg-score-medium/8',
  low: 'bg-score-low/8',
  critical: 'bg-score-critical/8',
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
      .map((unit) => {
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
      <div className="text-sm text-status-warning-text p-3 bg-status-warning/10 rounded-lg border border-status-warning/25">
        {TRANSFER_RECOMMENDATIONS_LABELS.noUnitsAvailable}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-ui-muted">
          {TRANSFER_RECOMMENDATIONS_LABELS.unitsAvailable(rankedUnits.length)}
        </p>
      </div>

      <div className="space-y-2">
        {displayedUnits.map((unit, index) => {
          const level = getScoreLevel(unit.fitScore)
          const eligibleSpots = unit.spots.filter((spot) => eligibleSpotTypes.includes(spot.type))
          const isSelected = unit.id === selectedUnitId
          const isExpanded = expandedUnitId === unit.id
          const isEmpty = unit.residents.length === 0

          return (
            <div
              key={unit.id}
              className={`rounded-lg border-2 transition-all ${
                isSelected
                  ? 'border-brand-primary bg-brand-primary/8 ring-2 ring-brand-primary/20'
                  : `border-ui-border hover:border-ui-border-strong ${SCORE_CARD_BG[level]}`
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
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded font-medium ${SCORE_TOKENS.excellent.soft}`}
                        >
                          Empfohlen
                        </span>
                      )}
                      <span className="font-semibold text-ui-text">{unit.code}</span>
                      <span className="text-sm text-ui-muted truncate">{unit.address}</span>
                    </div>

                    {/* Spots available */}
                    <div className="flex items-center gap-2 mt-1 text-xs text-ui-muted">
                      <span className="font-medium">
                        {PLACEMENT_ACTIONS_LABELS.spotsAvailableCount(eligibleSpots.length)}
                      </span>
                    </div>

                    {/* Current residents preview */}
                    <div className="mt-2">
                      {isEmpty ? (
                        <p className="text-xs text-status-success-text font-medium">
                          Leer - keine Mitbewohner
                        </p>
                      ) : (
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="text-xs text-ui-muted">Klient*in:</span>
                          {unit.residents
                            .slice(0, DISPLAY_LIMITS.dashboardItems)
                            .map((resident, i) => (
                              <span
                                key={resident.id}
                                className={`text-xs px-1.5 py-0.5 rounded ${getScoreBgClass(resident.compatibilityScore)}`}
                                title={`${resident.compatibilityScore}% kompatibel`}
                              >
                                {residentName(resident)} ({resident.compatibilityScore}%)
                              </span>
                            ))}
                          {unit.residents.length > 3 && (
                            <span className="text-xs text-ui-muted">
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
                    <span className={`chip ${SCORE_TOKENS[level].soft}`}>
                      {COMPATIBILITY_SCORE_LABELS[level]}
                    </span>
                  </div>
                </div>
              </button>

              {/* Expand/collapse for details */}
              {!isEmpty && (
                <div className="border-t border-ui-border">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setExpandedUnitId(isExpanded ? null : unit.id)
                    }}
                    className="w-full px-3 py-2 text-xs text-ui-muted hover:bg-ui-subtle flex items-center justify-center gap-1"
                  >
                    {isExpanded ? '▲ Details ausblenden' : '▼ Details zu Mitbewohnern anzeigen'}
                  </button>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="px-3 pb-3 space-y-3">
                      {/* Apartment-level factors */}
                      {(unit.strengths.length > 0 || unit.concerns.length > 0) && (
                        <div className="p-2 bg-ui-surface rounded border border-ui-border">
                          <p className="text-xs font-medium text-ui-muted mb-1">
                            Wohnungs-Faktoren
                          </p>
                          <div className="space-y-1">
                            {unit.strengths.map((s, i) => (
                              <p key={i} className="text-xs text-status-success-text">
                                + {s}
                              </p>
                            ))}
                            {unit.concerns.map((c, i) => (
                              <p key={i} className="text-xs text-status-warning-text">
                                - {c}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Individual resident compatibility */}
                      <div>
                        <p className="text-xs font-medium text-ui-muted mb-2">
                          {TRANSFER_RECOMMENDATIONS_LABELS.roommateCompatibility}
                        </p>
                        <div className="space-y-2">
                          {unit.residents.map((resident) => {
                            const residentLevel = getScoreLevel(resident.compatibilityScore)
                            return (
                              <div
                                key={resident.id}
                                className={`p-2 rounded ${SCORE_TOKENS[residentLevel].soft}`}
                              >
                                <div className="flex items-center justify-between">
                                  <Link
                                    href={`/residents/${resident.id}`}
                                    className="font-medium text-sm text-ui-text hover:text-status-info-text"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {residentName(resident)}
                                  </Link>
                                  <span
                                    className={`text-sm font-bold ${getScoreColorClass(resident.compatibilityScore)}`}
                                  >
                                    {resident.compatibilityScore}%
                                  </span>
                                </div>
                                {resident.keyFactors.length > 0 && (
                                  <div className="mt-1 text-xs text-ui-muted">
                                    {resident.keyFactors
                                      .slice(0, DISPLAY_LIMITS.matchStrengths)
                                      .map((factor, i) => (
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
          className="w-full py-2 text-xs text-ui-muted hover:text-ui-text border border-dashed border-ui-border-strong rounded-lg hover:border-ui-muted"
        >
          {TRANSFER_RECOMMENDATIONS_LABELS.showMoreUnits(hiddenCount)}
        </button>
      )}

      {/* Hidden input for form submission */}
      <input type="hidden" name="targetHousingUnitId" value={selectedUnitId} />
    </div>
  )
}

export type { UnitCompatibilityData, ResidentInUnit }
