import Link from 'next/link'
import type { Resident, Placement } from '@prisma/client'
import type { ApartmentConflict } from '@/lib/compatibility/types'
import type { MatchResult, CompatibilityDetail } from '@/lib/matching/types'
import { placeResident } from '@/lib/actions/matching'
import {
  SLEEP_SCHEDULE_LABELS,
  SMOKING_STATUS_LABELS,
  SOCIAL_STYLE_LABELS,
  getLabel,
} from '@/lib/constants'
import { getScoreColorClass } from '@/lib/utils'
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
}

export function MatchCard({ match, resident }: Props) {
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
    <div className={`p-4 border rounded-lg ${hasBlockingIssues ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
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
            <p className="text-xs text-green-600">Leer</p>
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
                Verlauf: {match.unitMetrics.label}
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
              Wohnungs-Profil ({match.apartmentProfile.currentResidentCount} Bewohner)
            </p>
            <span className={`text-sm font-bold ${getScoreColorClass(match.apartmentFit.fitScore)}`}>
              {match.apartmentFit.fitScore}% Passend
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
              {match.apartmentFit.strengths.slice(0, 2).map((strength: string, i: number) => (
                <p key={i} className="text-xs text-green-600">✓ {strength}</p>
              ))}
            </div>
          )}

          {/* Expandable score derivation */}
          <details className="mt-2 text-xs">
            <summary className="cursor-pointer text-blue-700 hover:text-blue-900 font-medium">
              📊 Score-Berechnung anzeigen
            </summary>
            <div className="mt-2 p-2 bg-white border border-blue-100 rounded text-gray-700">
              <p className="font-semibold mb-1">Fit Score: {match.apartmentFit.fitScore}%</p>
              <p className="text-gray-500 mb-2">Basis: 100 Punkte</p>

              {/* Conflict deductions */}
              {match.apartmentFit.conflicts.length > 0 && (
                <div className="mb-2">
                  <p className="font-medium text-red-700">Abzüge (Konflikte):</p>
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
                  <p className="font-medium text-green-700">Bonus (Stärken): +{Math.min(match.apartmentFit.strengths.length * 3, 20)}</p>
                  {match.apartmentFit.strengths.map((s: string, i: number) => (
                    <p key={i} className="ml-2 text-green-600">• {s}</p>
                  ))}
                </div>
              )}

              {/* Small group bonus */}
              {match.apartmentProfile.currentResidentCount <= 2 && (
                <p className="text-green-700">Bonus (kleine Gruppe): +5</p>
              )}

              <p className="mt-2 pt-2 border-t border-gray-200 font-semibold">
                = {match.apartmentFit.fitScore}% Gesamtpassung
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
                  📊 Historische Daten ({realSuccessData.totalPlacements} Platzierungen):
                </span>
                <span className={`text-xs font-bold ${getScoreColorClass(realSuccessData.successRate)}`}>
                  {realSuccessData.successRate}% Erfolgsrate
                </span>
              </div>
              <p className="text-xs text-purple-600 mt-1">
                {realSuccessData.successfulPlacements}/{realSuccessData.totalPlacements} Platzierungen mit ähnlicher Kompatibilität ({match.apartmentFit.fitScore}% ±10) waren erfolgreich
              </p>
            </>
          ) : (
            <div className="text-xs text-purple-600">
              📊 Keine historischen Daten für ähnliche Kompatibilitätswerte ({match.apartmentFit.fitScore}% ±10) verfügbar.
            </div>
          )}
        </div>
      )}

      {/* Positive factors */}
      {(allStrengths.length > 0 || sharedLanguages.length > 0 || occupancy === 0) && (
        <div className="mb-3 space-y-1">
          {occupancy === 0 && (
            <p className="text-xs text-green-600">✓ Keine Mitbewohner - keine Konflikte</p>
          )}
          {sharedLanguages.length > 0 && (
            <p className="text-xs text-green-600">
              ✓ Gemeinsame Sprache mit {match.unit.placements.filter((p) =>
                (resident.languages || []).some((l: string) => (p.resident.languages || []).includes(l))
              ).length} Bewohner(n)
            </p>
          )}
          {allStrengths.slice(0, 2).map((strength, i) => (
            <p key={i} className="text-xs text-green-600">✓ {strength}</p>
          ))}
        </div>
      )}

      {/* Current residents with actual compatibility info */}
      {match.unit.placements.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-1">Aktuelle Bewohner:</p>
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
                    {concernCount > 0 && ` · ${concernCount} Bedenken`}
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
          {allConcerns.slice(0, 3).map((concern, i) => (
            <p key={i} className="text-xs text-orange-600">⚠️ {concern}</p>
          ))}
          {allConcerns.length > 3 && (
            <p className="text-xs text-gray-400">+{allConcerns.length - 3} weitere Bedenken</p>
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
                ? 'Blockiert'
                : fitScore < 50
                ? 'Platzieren (niedrige Kompatibilität)'
                : 'Platzieren'}
            </button>
          </form>
        )
      })()}
    </div>
  )
}
