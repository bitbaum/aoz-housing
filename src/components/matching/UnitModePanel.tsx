import Link from 'next/link'
import type { MatchUnit, UnitMatch } from '@/lib/matching/types'
import { AGE_RANGE_LABELS, LANGUAGE_LABELS, MATCHING_LABELS, getLabel } from '@/lib/constants'
import { getScoreColorClass } from '@/lib/utils'
import { DISPLAY_LIMITS } from '@/lib/config/thresholds'
import { residentInitials, residentName } from '@/lib/utils/resident-name'

interface Props {
  selectedUnit: MatchUnit
  unitMatches: UnitMatch[]
}

export function UnitModePanel({ selectedUnit, unitMatches }: Props) {
  const freeSpots = selectedUnit.spots?.filter((s) => s.status === 'AVAILABLE').length ?? 0
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-ui-text">
            {MATCHING_LABELS.matchingResidents}
          </h2>
          <p className="text-sm text-ui-muted">
            {selectedUnit.placements.length}/{selectedUnit.totalBeds} {MATCHING_LABELS.occupied} ·{' '}
            {freeSpots} {MATCHING_LABELS.freeSpots(freeSpots)}
          </p>
        </div>
        <Link
          href="/matching"
          className="inline-flex items-center min-h-[44px] px-1 text-sm text-ui-muted hover:text-ui-muted"
        >
          {MATCHING_LABELS.back}
        </Link>
      </div>

      {/* Current residents in unit */}
      {selectedUnit.placements.length > 0 && (
        <div className="mb-4 p-3 bg-ui-subtle rounded-lg">
          <p className="text-xs font-semibold text-ui-muted uppercase mb-2">
            {MATCHING_LABELS.currentResidents}
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedUnit.placements.map((p) => (
              <Link
                key={p.id}
                href={`/residents/${p.residentId}`}
                className="inline-flex items-center gap-1.5 px-2 py-1 bg-ui-surface rounded-lg border border-ui-border text-sm hover:border-brand-primary"
              >
                <span className="w-5 h-5 bg-brand-primary text-ui-on-accent rounded-sm flex items-center justify-center text-xs">
                  {residentInitials(p.resident).slice(0, 1)}
                </span>
                {residentName(p.resident)}
              </Link>
            ))}
          </div>
        </div>
      )}

      {unitMatches.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-ui-muted">{MATCHING_LABELS.noMatchingResidents}</p>
          <Link href="/residents/new" className="btn-outline mt-4 inline-block">
            {MATCHING_LABELS.createNewResident}
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {unitMatches.slice(0, DISPLAY_LIMITS.unitMatches).map((match) => (
            <div
              key={match.resident.id}
              className={`p-3 border rounded-lg ${
                match.concerns.length > 0
                  ? 'border-score-low/25 bg-score-low/8'
                  : 'border-ui-border'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="avatar">{residentInitials(match.resident)}</div>
                  <div>
                    <Link
                      href={`/residents/${match.resident.id}`}
                      className="inline-flex items-center py-2 -my-2 font-medium text-ui-text hover:text-brand-primary"
                    >
                      {residentName(match.resident)}
                    </Link>
                    <p className="text-sm text-ui-muted">
                      {getLabel(AGE_RANGE_LABELS, match.resident.ageRange)} ·{' '}
                      {match.resident.languages
                        .slice(0, DISPLAY_LIMITS.languagePreview)
                        .map((l: string) => getLabel(LANGUAGE_LABELS, l))
                        .join(', ')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-lg font-bold ${getScoreColorClass(match.fitScore)}`}>
                    {match.fitScore}%
                  </span>
                  <Link
                    href={`/matching?resident=${match.resident.id}`}
                    className="btn-primary text-sm px-4 py-2 min-h-[44px]"
                  >
                    {MATCHING_LABELS.place}
                  </Link>
                </div>
              </div>
              {match.concerns.length > 0 && (
                <div className="mt-2 pt-2 border-t border-status-warning/30">
                  {match.concerns.map((c: string, i: number) => (
                    <p key={i} className="text-xs text-status-warning-text">
                      ⚠️ {c}
                    </p>
                  ))}
                </div>
              )}
              {match.apartmentFit.strengths.length > 0 && match.concerns.length === 0 && (
                <div className="mt-2 pt-2 border-t border-ui-border">
                  {match.apartmentFit.strengths
                    .slice(0, DISPLAY_LIMITS.matchStrengths)
                    .map((s: string, i: number) => (
                      <p key={i} className="text-xs text-status-success-text">
                        ✓ {s}
                      </p>
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  )
}
