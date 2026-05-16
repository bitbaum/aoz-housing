import Link from 'next/link'
import type { MatchUnit, UnitMatch } from '@/lib/matching/types'
import { AGE_RANGE_LABELS, LANGUAGE_LABELS, MATCHING_LABELS, getLabel } from '@/lib/constants'
import { getScoreColorClass } from '@/lib/utils'
import { DISPLAY_LIMITS } from '@/lib/config/thresholds'

interface Props {
  selectedUnit: MatchUnit
  unitMatches: UnitMatch[]
}

export function UnitModePanel({ selectedUnit, unitMatches }: Props) {
  const freeSpots = selectedUnit.spots?.filter(s => s.status === 'AVAILABLE').length ?? 0
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {MATCHING_LABELS.matchingResidents}
          </h2>
          <p className="text-sm text-gray-500">
            {selectedUnit.placements.length}/{selectedUnit.totalBeds} {MATCHING_LABELS.occupied} ·{' '}
            {freeSpots} {MATCHING_LABELS.freeSpots(freeSpots)}
          </p>
        </div>
        <Link
          href="/matching"
          className="inline-flex items-center min-h-[44px] px-1 text-sm text-gray-500 hover:text-gray-700"
        >
          {MATCHING_LABELS.back}
        </Link>
      </div>

      {/* Current residents in unit */}
      {selectedUnit.placements.length > 0 && (
        <div className="mb-4 p-3 bg-gray-50 rounded-xl">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
            {MATCHING_LABELS.currentResidents}
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedUnit.placements.map((p) => (
              <Link
                key={p.id}
                href={`/residents/${p.residentId}`}
                className="inline-flex items-center gap-1.5 px-2 py-1 bg-white rounded-lg border border-gray-100 text-sm hover:border-aoz-primary"
              >
                <span className="w-5 h-5 bg-aoz-primary text-white rounded-full flex items-center justify-center text-xs">
                  {p.resident.code.slice(0, 1)}
                </span>
                {p.resident.code}
              </Link>
            ))}
          </div>
        </div>
      )}

      {unitMatches.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">{MATCHING_LABELS.noMatchingResidents}</p>
          <Link href="/residents/new" className="btn-outline mt-4 inline-block">
            {MATCHING_LABELS.createNewResident}
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {unitMatches.slice(0, DISPLAY_LIMITS.unitMatches).map((match) => (
            <div
              key={match.resident.id}
              className={`p-3 border rounded-xl ${
                match.concerns.length > 0 ? 'border-orange-200 bg-orange-50' : 'border-gray-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-aoz-primary text-white rounded-full flex items-center justify-center font-medium">
                    {match.resident.code.slice(-3)}
                  </div>
                  <div>
                    <Link
                      href={`/residents/${match.resident.id}`}
                      className="inline-flex items-center py-2 -my-2 font-medium text-gray-900 hover:text-aoz-primary"
                    >
                      {match.resident.code}
                    </Link>
                    <p className="text-sm text-gray-500">
                      {getLabel(AGE_RANGE_LABELS, match.resident.ageRange)} ·{' '}
                      {match.resident.languages.slice(0, DISPLAY_LIMITS.languagePreview).map((l: string) => getLabel(LANGUAGE_LABELS, l)).join(', ')}
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
                <div className="mt-2 pt-2 border-t border-orange-200">
                  {match.concerns.map((c: string, i: number) => (
                    <p key={i} className="text-xs text-orange-600">⚠️ {c}</p>
                  ))}
                </div>
              )}
              {match.apartmentFit.strengths.length > 0 && match.concerns.length === 0 && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  {match.apartmentFit.strengths.slice(0, DISPLAY_LIMITS.matchStrengths).map((s: string, i: number) => (
                    <p key={i} className="text-xs text-green-600">✓ {s}</p>
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
