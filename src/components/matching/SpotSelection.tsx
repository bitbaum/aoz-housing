import type { Resident, Placement, PlacementSpot } from '@prisma/client'
import type { ApartmentConflict } from '@/lib/compatibility/types'
import type { MatchResult } from '@/lib/matching/types'
import { placeResident } from '@/lib/actions/matching'
import {
  SPOT_TYPE_LABELS,
  SPOT_TYPE_ICONS,
  getEligibleSpotTypes,
} from '@/lib/config/placement-spots'
import { MATCHING_LABELS } from '@/lib/constants'

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
        {MATCHING_LABELS.noSpotsAvailable}
      </p>
    )
  }

  return (
    <fieldset className="space-y-2">
      <legend className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        {MATCHING_LABELS.selectSpot}
      </legend>

      {eligibleSpots.length === 0 && (
        <p className="text-xs text-orange-600 mb-2" role="alert">
          <span aria-hidden="true">⚠️</span> {MATCHING_LABELS.noSuitableSpots}
          {!resident.hasMedicalDocumentation && ` ${MATCHING_LABELS.medDocsMissing}`}
        </p>
      )}

      {eligibleSpots.map((spot) => {
        const hasBlockingConflicts = match.apartmentFit?.conflicts.some(
          (c: ApartmentConflict) => c.severity === 'BLOCKING'
        ) || false
        const fitScore = match.apartmentFit?.fitScore || 100
        const spotName = spot.label || spot.code

        return (
          <form key={spot.id} action={placeResident} className="flex gap-2">
            <input type="hidden" name="residentId" value={resident.id} />
            <input type="hidden" name="housingUnitId" value={match.unit.id} />
            <input type="hidden" name="spotId" value={spot.id} />
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
            <div className="flex-1 flex items-center gap-2 p-2 border border-gray-100 rounded-xl bg-green-50">
              <span aria-hidden="true">{SPOT_TYPE_ICONS[spot.type as keyof typeof SPOT_TYPE_ICONS]}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {spotName}
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
              aria-label={hasBlockingConflicts
                ? `${spotName} ${MATCHING_LABELS.blocked.toLowerCase()}`
                : `${resident.code} in ${spotName} ${MATCHING_LABELS.place.toLowerCase()}`}
            >
              {hasBlockingConflicts
                ? MATCHING_LABELS.blocked
                : fitScore < 50
                ? MATCHING_LABELS.placeLowCompat
                : MATCHING_LABELS.place}
            </button>
          </form>
        )
      })}

      {ineligibleSpots.length > 0 && (
        <details className="text-xs text-gray-500">
          <summary className="cursor-pointer hover:text-gray-700">
            {MATCHING_LABELS.moreUnsuitableSpots(ineligibleSpots.length)}
          </summary>
          <div className="mt-2 space-y-1 pl-2">
            {ineligibleSpots.map((spot) => (
              <div key={spot.id} className="flex items-center gap-2 opacity-50">
                <span aria-hidden="true">{SPOT_TYPE_ICONS[spot.type as keyof typeof SPOT_TYPE_ICONS]}</span>
                <span>{spot.label || spot.code}</span>
                <span className="text-orange-500">
                  {spot.requiresMedicalDocs && !resident.hasMedicalDocumentation
                    ? MATCHING_LABELS.medDocsRequired
                    : MATCHING_LABELS.notAuthorized}
                </span>
              </div>
            ))}
          </div>
        </details>
      )}
    </fieldset>
  )
}
