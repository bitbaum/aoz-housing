import Link from 'next/link'
import type { MatchResult, ResidentWithPlacement } from '@/lib/matching/types'
import { EMPTY_STATE_LABELS, MATCH_RESULTS_LABELS, PLACEMENT_PANEL_LABELS } from '@/lib/constants'
import { placeResident } from '@/lib/actions/matching'
import { DISPLAY_LIMITS } from '@/lib/config/thresholds'
import { MatchCard } from './MatchCard'

interface Props {
  selectedResident: ResidentWithPlacement
  matches: MatchResult[]
  isNewResident: boolean
  fastMode: boolean
  searchQuery?: string
}

export function MatchResultsPanel({
  selectedResident,
  matches,
  isNewResident,
  fastMode,
  searchQuery,
}: Props) {
  const topMatches = matches.slice(0, DISPLAY_LIMITS.dashboardItems)
  const otherMatches = matches.slice(DISPLAY_LIMITS.dashboardItems, DISPLAY_LIMITS.unitMatches)

  const bestQuickMatch = matches.find((m) => {
    const hasBlockingConflicts = m.apartmentFit?.conflicts?.some((c) => c.severity === 'BLOCKING') || false
    const hasSpot = !!m.unit.spots?.some((s) => s.status === 'AVAILABLE')
    return !m.hasBlockingIssue && !hasBlockingConflicts && hasSpot
  })

  return (
    <>
      <div className="flex items-center justify-between mb-4 gap-3">
        <h2 className="text-lg font-semibold text-gray-900">
          {MATCH_RESULTS_LABELS.heading(selectedResident.code)}
        </h2>
        <div className="flex items-center gap-2">
          <Link
            href={`/matching?resident=${selectedResident.id}${isNewResident ? '&new=1' : ''}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ''}`}
            className={`btn-outline text-sm min-h-[44px] inline-flex items-center ${!fastMode ? 'bg-gray-100' : ''}`}
          >
            {MATCH_RESULTS_LABELS.modeStandard}
          </Link>
          <Link
            href={`/matching?resident=${selectedResident.id}&mode=fast${isNewResident ? '&new=1' : ''}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ''}`}
            className={`btn-outline text-sm min-h-[44px] inline-flex items-center ${fastMode ? 'bg-blue-100 text-blue-700 border-blue-300' : ''}`}
          >
            {MATCH_RESULTS_LABELS.modeFast}
          </Link>
          <Link
            href="/matching"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            {MATCH_RESULTS_LABELS.cancel}
          </Link>
        </div>
      </div>

      {matches.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">{EMPTY_STATE_LABELS.noAvailableUnits}</p>
          <Link href="/housing/new" className="btn-outline mt-4 inline-block">
            {EMPTY_STATE_LABELS.createHousing}
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bestQuickMatch && (
            <form action={placeResident} className="p-3 bg-green-50 border border-green-200 rounded-xl">
              <input type="hidden" name="residentId" value={selectedResident.id} />
              <input type="hidden" name="housingUnitId" value={bestQuickMatch.unit.id} />
              <input
                type="hidden"
                name="spotId"
                value={bestQuickMatch.unit.spots.find((s) => s.status === 'AVAILABLE')?.id || ''}
              />
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <p className="text-sm text-green-800">
                  {MATCH_RESULTS_LABELS.quickActionDesc(bestQuickMatch.unit.code, bestQuickMatch.apartmentFit.fitScore)}
                </p>
                <button type="submit" className="btn-primary text-sm min-h-[44px]">
                  {MATCH_RESULTS_LABELS.quickActionBtn}
                </button>
              </div>
            </form>
          )}

          {fastMode ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{MATCH_RESULTS_LABELS.fastModeTitle}</h3>
                <span className="text-xs text-gray-500">{MATCH_RESULTS_LABELS.fastModeSubtitle}</span>
              </div>
              {matches.slice(0, DISPLAY_LIMITS.topUnits).map((match, idx) => {
                const availableSpot = match.unit.spots.find((s) => s.status === 'AVAILABLE')
                const hasBlockingConflicts = match.apartmentFit?.conflicts?.some((c) => c.severity === 'BLOCKING') || false
                return (
                  <div key={match.unit.id} className={`p-3 rounded-xl border ${idx === 0 ? 'border-green-300 bg-green-50/60' : 'border-gray-100'}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900">#{idx + 1} · {match.unit.code}</p>
                        <p className="text-sm text-gray-500">{match.unit.address}</p>
                        <p className="text-xs text-gray-600 mt-1">
                          {MATCH_RESULTS_LABELS.fitInfo(match.apartmentFit.fitScore, match.unit.placements.length, match.unit.totalBeds)}
                        </p>
                      </div>
                      {availableSpot && !hasBlockingConflicts ? (
                        <form action={placeResident}>
                          <input type="hidden" name="residentId" value={selectedResident.id} />
                          <input type="hidden" name="housingUnitId" value={match.unit.id} />
                          <input type="hidden" name="spotId" value={availableSpot.id} />
                          <button type="submit" className="btn-primary text-sm min-h-[44px]">{PLACEMENT_PANEL_LABELS.place}</button>
                        </form>
                      ) : (
                        <span className="text-xs text-red-600">{PLACEMENT_PANEL_LABELS.blocked}</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <>
              {topMatches.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{MATCH_RESULTS_LABELS.topMatchesTitle}</h3>
                    <span className="text-xs text-gray-500">{MATCH_RESULTS_LABELS.topMatchesSubtitle}</span>
                  </div>
                  {topMatches.map((match, idx) => (
                    <MatchCard
                      key={match.unit.id}
                      match={match}
                      resident={selectedResident}
                      rank={idx + 1}
                    />
                  ))}
                </div>
              )}

              {otherMatches.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{MATCH_RESULTS_LABELS.otherMatchesTitle}</h3>
                  {otherMatches.map((match) => (
                    <MatchCard
                      key={match.unit.id}
                      match={match}
                      resident={selectedResident}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  )
}
