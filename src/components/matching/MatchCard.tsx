import Link from 'next/link'
import type { Resident } from '@prisma/client'
import type { ApartmentConflict } from '@/lib/compatibility/types'
import type { MatchResult, CompatibilityDetail } from '@/lib/matching/types'
import { placeResident } from '@/lib/actions/matching'
import { MATCHING_LABELS } from '@/lib/constants'
import { getScoreColorClass, getScoreLabel } from '@/lib/utils'
import { DISPLAY_LIMITS } from '@/lib/config/thresholds'
import { SCORE_TOKENS } from '@/lib/config/ui-tokens'
import { SpotSelection } from './SpotSelection'
import { ApartmentProfileSection } from './ApartmentProfileSection'

interface Props {
  match: MatchResult
  resident: Resident
  rank?: number
}

/**
 * Match card with progressive disclosure: the headline carries only what the
 * decision needs (score + tier, occupancy, top reasons, hard warnings, place
 * action); history, per-roommate breakdown and minor concerns live behind a
 * native <details> expander so staff can compare units at a glance.
 */
export function MatchCard({ match, resident, rank }: Props) {
  const occupancy = match.unit.placements.length
  const realSuccessData = match.realSuccessData

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

  const roommateLanguages = match.unit.placements.flatMap(
    (p) => p.resident.languages || []
  )
  const sharedLanguages = (resident.languages || []).filter(
    (l: string) => roommateLanguages.includes(l)
  )

  const isBlockingConcern = (c: string) =>
    c.includes('Rollstuhl') || c.includes('Erdgeschoss')
  const blockingUnitConcerns = match.unitConcerns.filter(isBlockingConcern)
  const otherUnitConcerns = match.unitConcerns.filter((c) => !isBlockingConcern(c))
  const hasBlockingIssues = blockingUnitConcerns.length > 0

  const fitScore = match.apartmentFit?.fitScore ?? null
  const highRisk =
    match.unitMetrics &&
    (match.unitMetrics.riskLevel === 'HIGH' || match.unitMetrics.riskLevel === 'CRITICAL')

  const detailCount =
    allConcerns.length + otherUnitConcerns.length + match.unit.placements.length

  return (
    <div className={`p-4 border rounded-lg ${hasBlockingIssues ? 'border-status-error/25 bg-status-error/8' : rank === 1 ? 'border-score-excellent/30 bg-score-excellent/8' : rank && rank <= 3 ? 'border-status-info/20 bg-status-info/8' : 'border-ui-border'}`}>
      {/* ── Headline: identity + score ─────────────────────────────── */}
      <div className="flex items-start justify-between mb-3 gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            {rank && rank <= 3 && (
              <span className={`chip font-semibold ${rank === 1 ? SCORE_TOKENS.excellent.soft : SCORE_TOKENS.good.soft}`}>
                {rank === 1 ? MATCHING_LABELS.topRecommendation : MATCHING_LABELS.topRank(rank)}
              </span>
            )}
            <Link
              href={`/housing/${match.unit.id}`}
              className="inline-flex items-center py-2 -my-2 font-semibold text-ui-text hover:text-aoz-primary"
            >
              {match.unit.code}
            </Link>
          </div>
          <p className="text-sm text-ui-muted">{match.unit.address}</p>
        </div>
        <div className="text-right shrink-0">
          {fitScore !== null && (
            <p
              className="explainable-number inline-block"
              title={MATCHING_LABELS.scoreLegend}
            >
              <span className={`text-xl font-bold ${getScoreColorClass(fitScore)}`}>
                {fitScore}%
              </span>
              <span className={`block text-xs font-medium ${getScoreColorClass(fitScore)}`}>
                {getScoreLabel(fitScore)}
              </span>
            </p>
          )}
          <p className="text-sm font-medium mt-1">
            {occupancy}/{match.unit.totalBeds} belegt
          </p>
          {occupancy === 0 && (
            <p className="text-xs text-status-success-text">{MATCHING_LABELS.empty}</p>
          )}
        </div>
      </div>

      {/* ── Headline: decision-critical signals ────────────────────── */}
      {(allStrengths.length > 0 || sharedLanguages.length > 0 || occupancy === 0) && (
        <div className="mb-3 space-y-1">
          {occupancy === 0 && (
            <p className="text-xs text-status-success-text">✓ {MATCHING_LABELS.noRoommatesNoConflicts}</p>
          )}
          {sharedLanguages.length > 0 && (
            <p className="text-xs text-status-success-text">
              ✓ {MATCHING_LABELS.sharedLanguageWith} {match.unit.placements.filter((p) =>
                (resident.languages || []).some((l: string) => (p.resident.languages || []).includes(l))
              ).length} {MATCHING_LABELS.residentsCount}
            </p>
          )}
          {allStrengths.slice(0, DISPLAY_LIMITS.matchStrengths).map((strength, i) => (
            <p key={i} className="text-xs text-status-success-text">✓ {strength}</p>
          ))}
        </div>
      )}

      {blockingUnitConcerns.length > 0 && (
        <div className="mb-3">
          {blockingUnitConcerns.map((concern: string, i: number) => (
            <p key={i} className="text-xs text-status-error-text font-medium">
              ⚠️ {concern}
            </p>
          ))}
        </div>
      )}

      {highRisk && match.unitMetrics && (
        <p className="mb-3 text-xs text-status-warning-text font-medium">
          ⚠️ {MATCHING_LABELS.history} {match.unitMetrics.label} — {match.unitMetrics.recentConflicts}{' '}
          {MATCHING_LABELS.conflictsLast30Days}
        </p>
      )}

      {match.safeguardWarnings.length > 0 && (
        <div className="mb-3 p-3 bg-status-warning/10 border border-status-warning/30 rounded-lg">
          <p className="text-xs font-semibold text-status-warning-text uppercase mb-1">
            Hinweis zur Bewertung
          </p>
          {match.safeguardWarnings.map((warning, i) => (
            <p key={i} className="text-xs text-status-warning-text">
              {warning.message}
            </p>
          ))}
        </div>
      )}

      {/* ── Details: history, breakdowns, minor concerns ───────────── */}
      <details className="mb-3 group">
        <summary className="cursor-pointer text-xs font-medium text-ui-muted hover:text-ui-text py-2 -my-1 select-none">
          {MATCHING_LABELS.showDetails}
          {detailCount > 0 ? ` (${detailCount})` : ''}
        </summary>
        <div className="mt-2 space-y-3">
          {match.unitMetrics && (
            <div className={`p-2 rounded border ${
              match.unitMetrics.riskLevel === 'CRITICAL' ? 'bg-severity-critical/10 border-severity-critical/30' :
              match.unitMetrics.riskLevel === 'HIGH' ? 'bg-severity-high/10 border-severity-high/30' :
              match.unitMetrics.riskLevel === 'MEDIUM' ? 'bg-severity-medium/10 border-severity-medium/30' :
              'bg-score-excellent/10 border-score-excellent/30'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-ui-muted">
                    {MATCHING_LABELS.history} {match.unitMetrics.label}
                  </span>
                  {match.unitMetrics.incidentFreeMonths > 0 && (
                    <span className="text-xs text-status-success-text">
                      ({match.unitMetrics.incidentFreeMonths}M konfliktfrei)
                    </span>
                  )}
                </div>
                <span className="text-xs text-ui-muted">
                  {match.unitMetrics.conflictRate.toFixed(1)}/Monat Ø
                </span>
              </div>
            </div>
          )}

          {match.apartmentProfile && (
            <ApartmentProfileSection
              apartmentProfile={match.apartmentProfile}
              apartmentFit={match.apartmentFit}
              placements={match.unit.placements}
              newResident={resident}
            />
          )}

          {match.apartmentFit && !match.apartmentProfile.isEmpty && (
            <div className="p-2 bg-aoz-secondary/8 border border-aoz-secondary/20 rounded">
              {realSuccessData && realSuccessData.totalPlacements > 0 ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-aoz-secondary">
                      📊 {MATCHING_LABELS.historicalData} ({realSuccessData.totalPlacements} {MATCHING_LABELS.placements}):
                    </span>
                    <span className={`text-xs font-bold ${getScoreColorClass(realSuccessData.successRate)}`}>
                      {realSuccessData.successRate}% {MATCHING_LABELS.successRate}
                    </span>
                  </div>
                  <p className="text-xs text-aoz-secondary/80 mt-1">
                    {realSuccessData.successfulPlacements}/{realSuccessData.totalPlacements} {MATCHING_LABELS.placementsWithSimilar} ({match.apartmentFit.fitScore}% {MATCHING_LABELS.plusMinusTen}) {MATCHING_LABELS.successRateDesc(realSuccessData.successRate)}
                  </p>
                </>
              ) : (
                <div className="text-xs text-aoz-secondary/80">
                  📊 {MATCHING_LABELS.noHistoricalData} ({match.apartmentFit.fitScore}% {MATCHING_LABELS.plusMinusTen}) {MATCHING_LABELS.available}.
                </div>
              )}
            </div>
          )}

          {match.unit.placements.length > 0 && (
            <div>
              <p className="text-xs text-ui-muted mb-1">{MATCHING_LABELS.currentResidents}</p>
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
                      <span className={concernCount > 0 ? 'text-status-warning-text' : 'text-status-success-text'}>
                        {hasSharedLang ? '✓ Sprache' : '✗ Sprache'}
                        {concernCount > 0 && ` · ${concernCount} ${MATCHING_LABELS.concerns}`}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {otherUnitConcerns.length > 0 && (
            <div>
              {otherUnitConcerns.map((concern: string, i: number) => (
                <p key={i} className="text-xs text-status-warning-text">
                  ⚠️ {concern}
                </p>
              ))}
            </div>
          )}

          {allConcerns.length > 0 && (
            <div>
              {allConcerns.slice(0, DISPLAY_LIMITS.matchConcerns).map((concern, i) => (
                <p key={i} className="text-xs text-status-warning-text">⚠️ {concern}</p>
              ))}
              {allConcerns.length > DISPLAY_LIMITS.matchConcerns && (
                <p className="text-xs text-ui-muted">{MATCHING_LABELS.moreConcerns(allConcerns.length - DISPLAY_LIMITS.matchConcerns)}</p>
              )}
            </div>
          )}
        </div>
      </details>

      {/* ── Action ─────────────────────────────────────────────────── */}
      {match.unit.spots && match.unit.spots.length > 0 && (
        <SpotSelection
          spots={match.unit.spots}
          resident={resident}
          match={match}
        />
      )}

      {(!match.unit.spots || match.unit.spots.length === 0) && (() => {
        const hasBlockingConflicts = match.apartmentFit?.conflicts.some(
          (c: ApartmentConflict) => c.severity === 'BLOCKING'
        ) || false
        const actionFitScore = match.apartmentFit?.fitScore || 100

        return (
          <form action={placeResident}>
            <input type="hidden" name="residentId" value={resident.id} />
            <input type="hidden" name="housingUnitId" value={match.unit.id} />
            <input type="hidden" name="apartmentFitScore" value={actionFitScore} />
            <input type="hidden" name="hasBlockingConflicts" value={String(hasBlockingConflicts)} />
            <button
              type="submit"
              className={`btn-primary w-full ${hasBlockingConflicts ? 'opacity-50 cursor-not-allowed bg-ui-muted' : ''}`}
              disabled={hasBlockingConflicts}
            >
              {hasBlockingConflicts
                ? MATCHING_LABELS.blocked
                : actionFitScore < 50
                ? MATCHING_LABELS.placeLowCompat
                : MATCHING_LABELS.place}
            </button>
          </form>
        )
      })()}
    </div>
  )
}
