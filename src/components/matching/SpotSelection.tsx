import type { Resident, Placement, PlacementSpot } from '@prisma/client'
import type { ApartmentConflict } from '@/lib/compatibility/types'
import type { MatchResult } from '@/lib/matching/types'
import { placeResident } from '@/lib/actions/matching'
import {
  SPOT_TYPE_LABELS,
  SPOT_TYPE_ICONS,
  getEligibleSpotTypes,
} from '@/lib/config/placement-spots'

type SpotWithPlacements = PlacementSpot & { placements: Placement[] }

interface Props {
  spots: SpotWithPlacements[]
  resident: Resident
  match: MatchResult
}

export function SpotSelection({ spots, resident, match }: Props) {
  const eligibleTypes = getEligibleSpotTypes(
    resident.hasMedicalDocumentation,
    resident.medicalDocType
  )

  const availableSpots = spots.filter(
    (spot) => spot.placements.length === 0 && spot.status === 'AVAILABLE'
  )

  const eligibleSpots = availableSpots.filter((spot) =>
    eligibleTypes.includes(spot.type) &&
    (!spot.requiresMedicalDocs || resident.hasMedicalDocumentation)
  )
  const ineligibleSpots = availableSpots.filter(
    (spot) =>
      !eligibleTypes.includes(spot.type) ||
      (spot.requiresMedicalDocs && !resident.hasMedicalDocumentation)
  )

  if (availableSpots.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-2">
        Keine freien Plätze verfügbar
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        Platz auswählen
      </p>

      {eligibleSpots.length === 0 && (
        <p className="text-xs text-orange-600 mb-2">
          ⚠️ Keine Plätze für diesen Bewohner geeignet
          {!resident.hasMedicalDocumentation && ' (med. Dokumente fehlen)'}
        </p>
      )}

      {eligibleSpots.map((spot) => {
        const hasBlockingConflicts = match.apartmentFit?.conflicts.some(
          (c: ApartmentConflict) => c.severity === 'BLOCKING'
        ) || false
        const fitScore = match.apartmentFit?.fitScore || 100

        return (
          <form key={spot.id} action={placeResident} className="flex gap-2">
            <input type="hidden" name="residentId" value={resident.id} />
            <input type="hidden" name="housingUnitId" value={match.unit.id} />
            <input type="hidden" name="spotId" value={spot.id} />
            <input
              type="hidden"
              name="compatibilityScore"
              value={match.compatibilityDetails[0]?.score.overall || 0}
            />
            <input
              type="hidden"
              name="lifestyleScore"
              value={match.compatibilityDetails[0]?.score.lifestyle || 0}
            />
            <input
              type="hidden"
              name="socialScore"
              value={match.compatibilityDetails[0]?.score.social || 0}
            />
            <input
              type="hidden"
              name="practicalScore"
              value={match.compatibilityDetails[0]?.score.practical || 0}
            />
            <input
              type="hidden"
              name="riskScore"
              value={match.compatibilityDetails[0]?.score.risk || 0}
            />
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
            <div className="flex-1 flex items-center gap-2 p-2 border border-gray-200 rounded-lg bg-green-50">
              <span>{SPOT_TYPE_ICONS[spot.type as keyof typeof SPOT_TYPE_ICONS]}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {spot.label || spot.code}
                </p>
                <p className="text-xs text-gray-500">
                  {SPOT_TYPE_LABELS[spot.type as keyof typeof SPOT_TYPE_LABELS]}
                </p>
              </div>
            </div>
            <button
              type="submit"
              className={`btn-primary text-sm px-3 ${
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
      })}

      {ineligibleSpots.length > 0 && (
        <details className="text-xs text-gray-400">
          <summary className="cursor-pointer hover:text-gray-600">
            {ineligibleSpots.length} weitere Plätze (nicht geeignet)
          </summary>
          <div className="mt-2 space-y-1 pl-2">
            {ineligibleSpots.map((spot) => (
              <div key={spot.id} className="flex items-center gap-2 opacity-50">
                <span>{SPOT_TYPE_ICONS[spot.type as keyof typeof SPOT_TYPE_ICONS]}</span>
                <span>{spot.label || spot.code}</span>
                <span className="text-orange-500">
                  {spot.requiresMedicalDocs && !resident.hasMedicalDocumentation
                    ? '(med. Dok. erforderlich)'
                    : '(nicht berechtigt)'}
                </span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}
