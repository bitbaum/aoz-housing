import Link from 'next/link'
import { AGE_RANGE_LABELS, LANGUAGE_LABELS, WHO_FITS_HERE_LABELS, getLabel } from '@/lib/constants'
import { getScoreColorClass } from '@/lib/utils'
import { getScoreLevel, DISPLAY_LIMITS } from '@/lib/config/thresholds'

interface CompatibleResident {
  resident: {
    id: string
    code: string
    ageRange: string
    languages: string[]
  }
  fitScore: number
  strengths: string[]
  concerns: string[]
}

interface Props {
  unitId: string
  availableSpaces: number
  compatibleResidents: CompatibleResident[]
}

export function WhoFitsHereCard({ unitId, availableSpaces, compatibleResidents }: Props) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {WHO_FITS_HERE_LABELS.heading}
          </h2>
          <p className="text-sm text-gray-500">
            {availableSpaces} {availableSpaces === 1 ? WHO_FITS_HERE_LABELS.spaceCountSingular : WHO_FITS_HERE_LABELS.spaceCountPlural}
          </p>
        </div>
        <Link
          href={`/matching?unit=${unitId}`}
          className="btn-outline text-sm"
        >
          {WHO_FITS_HERE_LABELS.showAll}
        </Link>
      </div>

      {compatibleResidents.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-gray-500 mb-3">{WHO_FITS_HERE_LABELS.emptyState}</p>
          <Link href="/residents/new" className="btn-primary text-sm">
            {WHO_FITS_HERE_LABELS.addResident}
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {compatibleResidents.map((match) => {
            const scoreLevel = getScoreLevel(match.fitScore)
            const isGoodFit = scoreLevel === 'excellent' || scoreLevel === 'good'
            return (
              <div
                key={match.resident.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  match.concerns.length > 0
                    ? 'border-orange-200 bg-orange-50'
                    : isGoodFit
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-aoz-primary text-white rounded-full flex items-center justify-center font-medium">
                    {match.resident.code.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <Link
                      href={`/residents/${match.resident.id}`}
                      className="font-medium text-gray-900 hover:text-aoz-primary"
                    >
                      {match.resident.code}
                    </Link>
                    <p className="text-sm text-gray-500">
                      {getLabel(AGE_RANGE_LABELS, match.resident.ageRange)} ·{' '}
                      {match.resident.languages?.slice(0, DISPLAY_LIMITS.languagePreview).map((l: string) => getLabel(LANGUAGE_LABELS, l)).join(', ')}
                    </p>
                    {match.strengths.length > 0 && match.concerns.length === 0 && (
                      <p className="text-xs text-green-600 mt-0.5">
                        ✓ {match.strengths[0]}
                      </p>
                    )}
                    {match.concerns.length > 0 && (
                      <p className="text-xs text-orange-600 mt-0.5">
                        {match.concerns[0]}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-lg font-bold ${getScoreColorClass(match.fitScore)}`}>
                    {match.fitScore}%
                  </span>
                  <Link
                    href={`/matching?resident=${match.resident.id}`}
                    className="btn-primary text-sm px-3 py-1"
                  >
                    {WHO_FITS_HERE_LABELS.place}
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
