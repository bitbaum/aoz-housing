import Link from 'next/link'
import type { Resident, Placement } from '@prisma/client'
import type { ApartmentConflict } from '@/lib/compatibility/types'
import type { MatchResult, CompatibilityDetail } from '@/lib/matching/types'
import { placeResident } from '@/lib/actions/matching'
import {
  SLEEP_SCHEDULE_LABELS,
  SMOKING_STATUS_LABELS,
  SOCIAL_STYLE_LABELS,
  MATCHING_LABELS,
  getLabel,
} from '@/lib/constants'
import { getScoreColorClass } from '@/lib/utils'
import { DISPLAY_LIMITS } from '@/lib/config/thresholds'
import { HeadToHeadComparison } from './HeadToHeadComparison'
import { SpotSelection } from './SpotSelection'

/** Format conflict values with proper SSOT labels */
function formatConflictValue(attribute: string, value: string | number): string {
  if (typeof value === 'number') {
    return value.toFixed(1)
  }
  switch (attribute) {
    case 'sleepSchedule':
      return getLabel(SLEEP_SCHEDULE_LABELS, value)
    case 'smokingStatus':
      return getLabel(SMOKING_STATUS_LABELS, value)
    case 'socialStyle':
      return getLabel(SOCIAL_STYLE_LABELS, value)
    default:
      return value
  }
}

interface Props {
  match: MatchResult
  resident: Resident
  rank?: number
}

export function MatchCard({ match, resident, rank }: Props) {
  const occupancy = match.unit.placements.length
  const realSuccessData = match.realSuccessData

  // Collect all strengths and concerns from roommate compatibility
  const allStrengths: string[] = []
  const allConcerns: string[] = []

  match.compatibilityDetails.forEach((detail: CompatibilityDetail) => {
    detail.score.strengths?.forEach((s: string) => {
      if (!allStrengths.includes(s)) allStrengths.push(s)
    })
    detail.score.concerns?.forEach((c: string) => {
      if (!allConcerns.includes(c)) allConcerns.push(c)
    })
  })

  // Count shared languages with roommates
  const roommateLanguages = match.unit.placements.flatMap(
    (p) => p.resident.languages || []
  )
  const sharedLanguages = (resident.languages || []).filter(
    (l: string) => roommateLanguages.includes(l)
  )

  const totalIssues = match.unitConcerns.length + allConcerns.length
  const hasBlockingIssues = match.unitConcerns.some((c: string) =>
    c.includes('Rollstuhl') || c.includes('Erdgeschoss')
  )

  return (
    <div className={`p-4 border rounded-lg ${hasBlockingIssues ? 'border-red-200 bg-red-50' : rank === 1 ? 'border-green-300 bg-green-50/50' : rank && rank <= 3 ? 'border-blue-200 bg-blue-50/40' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between mb-3 gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            {rank && rank <= 3 && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${rank === 1 ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                {rank === 1 ? MATCHING_LABELS.topRecommendation : MATCHING_LABELS.topRank(rank)}
              </span>
            )}
            <Link
              href={`/housing/${match.unit.id}`}
              className="font-semibold text-gray-900 hover:text-aoz-primary"
            >
              {match.unit.code}
            </Link>
          </div>
          <p className="text-sm text-gray-500">{match.unit.address}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium">
            {occupancy}/{match.unit.totalBeds} belegt
          </p>
          {occupancy === 0 && (
            <p className="text-xs text-green-600">{MATCHING_LABELS.empty}</p>
          )}
        </div>
      </div>

      {/* Unit Historical Performance */}
      {match.unitMetrics && (
        <div className={`mb-3 p-2 rounded border ${
          match.unitMetrics.riskLevel === 'CRITICAL' ? 'bg-red-50 border-red-300' :
          match.unitMetrics.riskLevel === 'HIGH' ? 'bg-orange-50 border-orange-300' :
          match.unitMetrics.riskLevel === 'MEDIUM' ? 'bg-yellow-50 border-yellow-300' :
          'bg-green-50 border-green-300'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-700">
                {MATCHING_LABELS.history} {match.unitMetrics.label}
              </span>
              {match.unitMetrics.incidentFreeMonths > 0 && (
                <span className="text-xs text-green-600">
                  ({match.unitMetrics.incidentFreeMonths}M konfliktfrei)
                </span>
              )}
            </div>
            <span className="text-xs text-gray-600">
              {match.unitMetrics.conflictRate.toFixed(1)}/Monat Ø
            </span>
          </div>
          {match.unitMetrics.riskLevel === 'HIGH' || match.unitMetrics.riskLevel === 'CRITICAL' ? (
            <p className="text-xs text-orange-700 mt-1">
              ⚠️ {match.unitMetrics.recentConflicts} Konflikte letzte 30 Tage
            </p>
          ) : null}
        </div>
      )}

      {/* Apartment Profile Summary */}
      {match.apartmentProfile && !match.apartmentProfile.isEmpty && (
        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-blue-800 uppercase">
              {MATCHING_LABELS.apartmentProfile} ({match.apartmentProfile.currentResidentCount} {MATCHING_LABELS.residents})
            </p>
            <span className={`text-sm font-bold ${getScoreColorClass(match.apartmentFit.fitScore)}`}>
              {match.apartmentFit.fitScore}% {MATCHING_LABELS.matching}
            </span>
          </div>

          {/* Head-to-head comparison table */}
          <HeadToHeadComparison
            currentResidents={match.unit.placements.map((p) => p.resident)}
            newResident={resident}
            apartmentProfile={match.apartmentProfile}
          />

          {/* Blocking/High conflicts */}
          {match.apartmentFit.conflicts.filter((c: ApartmentConflict) => c.severity === 'BLOCKING' || c.severity === 'HIGH').length > 0 && (
            <div className="space-y-1">
              {match.apartmentFit.conflicts
                .filter((c: ApartmentConflict) => c.severity === 'BLOCKING' || c.severity === 'HIGH')
                .map((conflict: ApartmentConflict, i: number) => (
                  <p key={i} className={`text-xs ${
                    conflict.severity === 'BLOCKING' ? 'text-red-600 font-medium' : 'text-orange-600'
                  }`}>
                    {conflict.severity === 'BLOCKING' ? '🚫' : '⚠️'} {conflict.message}
                  </p>
                ))
              }
            </div>
          )}

          {/* Strengths */}
          {match.apartmentFit.strengths.length > 0 && match.apartmentFit.conflicts.filter((c: ApartmentConflict) => c.severity === 'BLOCKING' || c.severity === 'HIGH').length === 0 && (
            <div className="space-y-1">
              {match.apartmentFit.strengths.slice(0, DISPLAY_LIMITS.matchStrengths).map((strength: string, i: number) => (
                <p key={i} className="text-xs text-green-600">✓ {strength}</p>
              ))}
            </div>
          )}

          {/* Expandable score derivation */}
          <details className="mt-2 text-xs">
            <summary className="cursor-pointer text-blue-700 hover:text-blue-900 font-medium">
              📊 {MATCHING_LABELS.scoreDerivation}
            </summary>
            <div className="mt-2 p-2 bg-white border border-blue-100 rounded text-gray-700">
              <p className="font-semibold mb-1">Fit Score: {match.apartmentFit.fitScore}%</p>
              <p className="text-gray-500 mb-2">{MATCHING_LABELS.basePenalty}</p>

              {/* Conflict deductions */}
              {match.apartmentFit.conflicts.length > 0 && (
                <div className="mb-2">
                  <p className="font-medium text-red-700">{MATCHING_LABELS.conflictDeductions}</p>
                  {match.apartmentFit.conflicts.map((c: ApartmentConflict, i: number) => (
                    <p key={i} className="ml-2">
                      • {c.attribute}: -{c.severity === 'BLOCKING' ? 40 : c.severity === 'HIGH' ? 20 : c.severity === 'MEDIUM' ? 10 : 5}
                      <span className="text-gray-500 ml-1">
                        ({formatConflictValue(c.attribute, c.residentValue)} vs {formatConflictValue(c.attribute, c.apartmentAverage)})
                      </span>
                    </p>
                  ))}
                </div>
              )}

              {/* Strength bonuses */}
              {match.apartmentFit.strengths.length > 0 && (
                <div className="mb-2">
                  <p className="font-medium text-green-700">{MATCHING_LABELS.strengthBonus} +{Math.min(match.apartmentFit.strengths.length * 3, 20)}</p>
                  {match.apartmentFit.strengths.map((s: string, i: number) => (
                    <p key={i} className="ml-2 text-green-600">• {s}</p>
                  ))}
                </div>
              )}

              {/* Small group bonus */}
              {match.apartmentProfile.currentResidentCount <= 2 && (
                <p className="text-green-700">{MATCHING_LABELS.smallGroupBonus} +5</p>
              )}

              <p className="mt-2 pt-2 border-t border-gray-200 font-semibold">
                = {match.apartmentFit.fitScore}% {MATCHING_LABELS.totalFit}
              </p>
            </div>
          </details>
        </div>
      )}

      {/* Success Rate - REAL DATA from database */}
      {match.apartmentFit && !match.apartmentProfile.isEmpty && (
        <div className="mb-3 p-2 bg-purple-50 border border-purple-200 rounded">
          {realSuccessData && realSuccessData.totalPlacements > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs text-purple-700">
                  📊 {MATCHING_LABELS.historicalData} ({realSuccessData.totalPlacements} {MATCHING_LABELS.placements}):
                </span>
                <span className={`text-xs font-bold ${getScoreColorClass(realSuccessData.successRate)}`}>
                  {realSuccessData.successRate}% {MATCHING_LABELS.successRate}
                </span>
              </div>
              <p className="text-xs text-purple-600 mt-1">
                {realSuccessData.successfulPlacements}/{realSuccessData.totalPlacements} {MATCHING_LABELS.placementsWithSimilar} ({match.apartmentFit.fitScore}% {MATCHING_LABELS.plusMinusTen}) {MATCHING_LABELS.successRateDesc(realSuccessData.successRate)}
              </p>
            </>
          ) : (
            <div className="text-xs text-purple-600">
              📊 {MATCHING_LABELS.noHistoricalData} ({match.apartmentFit.fitScore}% {MATCHING_LABELS.plusMinusTen}) {MATCHING_LABELS.available}.
            </div>
          )}
        </div>
      )}

      {/* Positive factors */}
      {(allStrengths.length > 0 || sharedLanguages.length > 0 || occupancy === 0) && (
        <div className="mb-3 space-y-1">
          {occupancy === 0 && (
            <p className="text-xs text-green-600">✓ {MATCHING_LABELS.noRoommatesNoConflicts}</p>
          )}
          {sharedLanguages.length > 0 && (
            <p className="text-xs text-green-600">
              ✓ {MATCHING_LABELS.sharedLanguageWith} {match.unit.placements.filter((p) =>
                (resident.languages || []).some((l: string) => (p.resident.languages || []).includes(l))
              ).length} {MATCHING_LABELS.residentsCount}
            </p>
          )}
          {allStrengths.slice(0, DISPLAY_LIMITS.matchStrengths).map((strength, i) => (
            <p key={i} className="text-xs text-green-600">✓ {strength}</p>
          ))}
        </div>
      )}

      {/* Current residents with actual compatibility info */}
      {match.unit.placements.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-1">{MATCHING_LABELS.currentResidents}</p>
          <div className="space-y-1">
            {match.unit.placements.map((p) => {
              const detail = match.compatibilityDetails.find(
                (d: CompatibilityDetail) => d.resident.id === p.resident.id
              )
              const hasSharedLang = (resident.languages || []).some(
                (l: string) => (p.resident.languages || []).includes(l)
              )
              const concernCount = detail?.score.concerns?.length || 0
              return (
                <div key={p.id} className="flex items-center justify-between text-xs">
                  <span className="font-medium">{p.resident.code}</span>
                  <span className={concernCount > 0 ? 'text-orange-600' : 'text-green-600'}>
                    {hasSharedLang ? '✓ Sprache' : '✗ Sprache'}
                    {concernCount > 0 && ` · ${concernCount} ${MATCHING_LABELS.concerns}`}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Unit concerns (real issues) */}
      {match.unitConcerns.length > 0 && (
        <div className="mb-3">
          {match.unitConcerns.map((concern: string, i: number) => (
            <p key={i} className={`text-xs ${
              concern.includes('Rollstuhl') || concern.includes('Erdgeschoss')
                ? 'text-red-600 font-medium'
                : 'text-orange-600'
            }`}>
              ⚠️ {concern}
            </p>
          ))}
        </div>
      )}

      {/* Roommate concerns */}
      {allConcerns.length > 0 && (
        <div className="mb-3">
          {allConcerns.slice(0, DISPLAY_LIMITS.matchConcerns).map((concern, i) => (
            <p key={i} className="text-xs text-orange-600">⚠️ {concern}</p>
          ))}
          {allConcerns.length > DISPLAY_LIMITS.matchConcerns && (
            <p className="text-xs text-gray-500">{MATCHING_LABELS.moreConcerns(allConcerns.length - DISPLAY_LIMITS.matchConcerns)}</p>
          )}
        </div>
      )}

      {/* Available Spots */}
      {match.unit.spots && match.unit.spots.length > 0 && (
        <SpotSelection
          spots={match.unit.spots}
          resident={resident}
          match={match}
        />
      )}

      {/* Fallback: Place without spot (legacy) */}
      {(!match.unit.spots || match.unit.spots.length === 0) && (() => {
        const hasBlockingConflicts = match.apartmentFit?.conflicts.some(
          (c: ApartmentConflict) => c.severity === 'BLOCKING'
        ) || false
        const fitScore = match.apartmentFit?.fitScore || 100

        return (
          <form action={placeResident}>
            <input type="hidden" name="residentId" value={resident.id} />
            <input type="hidden" name="housingUnitId" value={match.unit.id} />
            <input
              type="hidden"
              name="apartmentFitScore"
              value={fitScore}
            />
            <input
              type="hidden"
              name="hasBlockingConflicts"
              value={String(hasBlockingConflicts)}
            />
            <button
              type="submit"
              className={`btn-primary w-full ${
                hasBlockingConflicts
                  ? 'opacity-50 cursor-not-allowed bg-gray-400'
                  : ''
              }`}
              disabled={hasBlockingConflicts}
            >
              {hasBlockingConflicts
                ? MATCHING_LABELS.blocked
                : fitScore < 50
                ? MATCHING_LABELS.placeLowCompat
                : MATCHING_LABELS.place}
            </button>
          </form>
        )
      })()}
    </div>
  )
}
