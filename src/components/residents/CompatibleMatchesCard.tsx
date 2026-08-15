import Link from 'next/link'
import { getScoreColorClass } from '@/lib/utils'
import { DISPLAY_LIMITS } from '@/lib/config/thresholds'
import { COMPATIBLE_MATCHES_LABELS } from '@/lib/constants'
import { residentInitials, residentName, type NamedResident } from '@/lib/utils/resident-name'

interface CompatibleUnit {
  unit: { id: string; code: string }
  fitScore: number
  residents: number
}

interface CompatibleResident {
  resident: NamedResident & { id: string; languages?: string[] | null }
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
      <h2 className="text-lg font-semibold text-ui-text mb-4">
        Passende Optionen
      </h2>

      {/* Compatible Units */}
      {compatibleUnits.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-ui-muted mb-3">{COMPATIBLE_MATCHES_LABELS.unitsTitle}</h3>
          <div className="space-y-2">
            {compatibleUnits.map(({ unit, fitScore, residents }) => (
              <Link
                key={unit.id}
                href={`/matching?resident=${residentId}`}
                className="flex items-center justify-between p-3 bg-ui-subtle rounded-lg hover:bg-ui-subtle"
              >
                <div>
                  <p className="font-medium text-ui-text">{unit.code}</p>
                  <p className="text-xs text-ui-muted">
                    {residents === 0 ? COMPATIBLE_MATCHES_LABELS.emptyUnit : COMPATIBLE_MATCHES_LABELS.residentCount(residents)}
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
          <h3 className="text-sm font-medium text-ui-muted mb-3">{COMPATIBLE_MATCHES_LABELS.residentsTitle}</h3>
          <div className="space-y-2">
            {compatibleResidents.map(({ resident: other, score }) => (
              <Link
                key={other.id}
                href={`/residents/${other.id}`}
                className="flex items-center justify-between p-3 bg-ui-subtle rounded-lg hover:bg-ui-subtle"
              >
                <div className="flex items-center gap-3">
                  <div className="avatar-sm">
                    {residentInitials(other)}
                  </div>
                  <div>
                    <p className="font-medium text-ui-text">{residentName(other)}</p>
                    <p className="text-xs text-ui-muted">
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
          <p className="text-xs text-ui-muted mt-3">
            {COMPATIBLE_MATCHES_LABELS.desc}
          </p>
        </div>
      )}
    </div>
  )
}
