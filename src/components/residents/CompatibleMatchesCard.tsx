import Link from 'next/link'
import { getScoreColorClass } from '@/lib/utils'
import { DISPLAY_LIMITS } from '@/lib/config/thresholds'

interface CompatibleUnit {
  unit: { id: string; code: string }
  fitScore: number
  residents: number
}

interface CompatibleResident {
  resident: { id: string; code: string; languages?: string[] | null }
  score: number
}

interface CompatibleMatchesCardProps {
  residentId: string
  compatibleUnits: CompatibleUnit[]
  compatibleResidents: CompatibleResident[]
}

export function CompatibleMatchesCard({
  residentId,
  compatibleUnits,
  compatibleResidents,
}: CompatibleMatchesCardProps) {
  if (compatibleUnits.length === 0 && compatibleResidents.length === 0) {
    return null
  }

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Passende Optionen
      </h2>

      {/* Compatible Units */}
      {compatibleUnits.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Beste Unterkünfte</h3>
          <div className="space-y-2">
            {compatibleUnits.map(({ unit, fitScore, residents }) => (
              <Link
                key={unit.id}
                href={`/matching?resident=${residentId}`}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
              >
                <div>
                  <p className="font-medium text-gray-900">{unit.code}</p>
                  <p className="text-xs text-gray-500">
                    {residents === 0 ? 'Leer' : `${residents} Bewohner`}
                  </p>
                </div>
                <span className={`text-sm font-bold ${getScoreColorClass(fitScore)}`}>
                  {fitScore}%
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Compatible Unplaced Residents */}
      {compatibleResidents.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Passende Mitbewohner (unplatziert)</h3>
          <div className="space-y-2">
            {compatibleResidents.map(({ resident: other, score }) => (
              <Link
                key={other.id}
                href={`/residents/${other.id}`}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-aoz-primary text-white rounded-full flex items-center justify-center text-sm">
                    {other.code.slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{other.code}</p>
                    <p className="text-xs text-gray-500">
                      {other.languages?.slice(0, DISPLAY_LIMITS.languagePreview).join(', ')}
                    </p>
                  </div>
                </div>
                <span className={`text-sm font-bold ${getScoreColorClass(score)}`}>
                  {Math.round(score)}%
                </span>
              </Link>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Diese Bewohner könnten zusammen platziert werden.
          </p>
        </div>
      )}
    </div>
  )
}
