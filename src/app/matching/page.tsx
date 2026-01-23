import { prisma } from '@/lib/db'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  AGE_RANGE_LABELS,
  LANGUAGE_LABELS,
  HOUSING_STATUS_LABELS,
  MEDICAL_DOC_TYPE_LABELS,
  getLabel,
} from '@/lib/constants'
import {
  getScoreLabel,
  getScoreColorClass,
  getScoreBgClass,
  getOccupancyColorClass,
} from '@/lib/utils'
import { calculateCompatibility } from '@/lib/compatibility'
import {
  SPOT_TYPE_LABELS,
  SPOT_TYPE_ICONS,
  getEligibleSpotTypes,
} from '@/lib/config/placement-spots'
import type { Resident } from '@prisma/client'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ resident?: string; unit?: string }>
}

async function placeResident(formData: FormData) {
  'use server'

  const residentId = formData.get('residentId') as string
  const housingUnitId = formData.get('housingUnitId') as string
  const spotId = (formData.get('spotId') as string) || null
  const compatibilityScore = parseFloat(
    formData.get('compatibilityScore') as string
  )
  const lifestyleScore = parseFloat(formData.get('lifestyleScore') as string)
  const socialScore = parseFloat(formData.get('socialScore') as string)
  const practicalScore = parseFloat(formData.get('practicalScore') as string)
  const riskScore = parseFloat(formData.get('riskScore') as string)
  const notes = formData.get('notes') as string

  // Create placement with optional spot
  await prisma.placement.create({
    data: {
      residentId,
      housingUnitId,
      spotId,
      startDate: new Date(),
      status: 'ACTIVE',
      compatibilityScore,
      lifestyleScore,
      socialScore,
      practicalScore,
      riskScore,
      placementNotes: notes || null,
    },
  })

  // Update spot status if assigned
  if (spotId) {
    await prisma.placementSpot.update({
      where: { id: spotId },
      data: { status: 'OCCUPIED' },
    })
  }

  // Update resident status
  await prisma.resident.update({
    where: { id: residentId },
    data: { status: 'PLACED' },
  })

  // Check if unit is now full
  const unit = await prisma.housingUnit.findUnique({
    where: { id: housingUnitId },
    include: { placements: { where: { status: 'ACTIVE' } } },
  })

  if (unit && unit.placements.length >= unit.totalBeds) {
    await prisma.housingUnit.update({
      where: { id: housingUnitId },
      data: { status: 'FULL' },
    })
  }

  redirect(`/residents/${residentId}`)
}

export default async function MatchingPage({ searchParams }: Props) {
  const params = await searchParams

  // Get unplaced residents
  const unplacedResidents = await prisma.resident.findMany({
    where: {
      status: 'ACTIVE',
      placements: { none: { status: 'ACTIVE' } },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Get available units with current residents and spots
  const availableUnits = await prisma.housingUnit.findMany({
    where: {
      status: { in: ['AVAILABLE', 'FULL'] },
    },
    include: {
      placements: {
        where: { status: 'ACTIVE' },
        include: { resident: true },
      },
      spots: {
        where: {
          status: 'AVAILABLE',
          type: { not: 'ROOM' }, // Only assignable spots
        },
        include: {
          placements: {
            where: { status: 'ACTIVE' },
          },
        },
      },
    },
    orderBy: { code: 'asc' },
  })

  // If resident is selected, calculate matches
  let selectedResident: Resident | null = null
  let matches: any[] = []

  if (params.resident) {
    const foundResident = await prisma.resident.findUnique({
      where: { id: params.resident },
    })
    selectedResident = foundResident

    if (foundResident) {
      matches = availableUnits
        .filter((unit) => unit.placements.length < unit.totalBeds)
        .map((unit) => {
          const currentResidents = unit.placements.map((p) => p.resident)

          // Calculate average compatibility with current residents
          let avgCompatibility = 100
          const compatibilityDetails: any[] = []

          if (currentResidents.length > 0) {
            const scores = currentResidents.map((resident) => {
              const score = calculateCompatibility(
                foundResident as any,
                resident as any
              )
              compatibilityDetails.push({
                resident,
                score,
              })
              return score.overall
            })
            avgCompatibility = scores.reduce((a, b) => a + b, 0) / scores.length
          }

          // Calculate unit fit (mobility, smoking, etc.)
          let unitFit = 100
          const unitConcerns: string[] = []

          if (
            foundResident.mobilityNeeds === 'WHEELCHAIR' &&
            !unit.wheelchairAccess
          ) {
            unitFit -= 50
            unitConcerns.push('Keine Rollstuhlzugänglichkeit')
          }
          if (
            foundResident.mobilityNeeds === 'GROUND_FLOOR' &&
            !unit.groundFloor &&
            !unit.elevator
          ) {
            unitFit -= 30
            unitConcerns.push('Nicht im Erdgeschoss')
          }
          if (
            foundResident.smokingStatus !== 'NON_SMOKER' &&
            !unit.smokingAllowed
          ) {
            unitFit -= 20
            unitConcerns.push('Rauchen nicht erlaubt')
          }
          if (!foundResident.sharedKitchen && unit.sharedKitchen) {
            unitFit -= 15
            unitConcerns.push('Nur geteilte Küche')
          }
          if (!foundResident.sharedBathroom && unit.sharedBathrooms > 0) {
            unitFit -= 15
            unitConcerns.push('Geteiltes Badezimmer')
          }

          const overallScore = Math.round(avgCompatibility * 0.7 + unitFit * 0.3)

          return {
            unit,
            avgCompatibility: Math.round(avgCompatibility),
            unitFit: Math.round(unitFit),
            overallScore,
            compatibilityDetails,
            unitConcerns,
          }
        })
        .sort((a, b) => b.overallScore - a.overallScore)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Matching</h1>
        <p className="text-gray-500">
          Finden Sie die optimale Platzierung für Bewohner
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left panel: Unplaced residents */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Unplatzierte Bewohner ({unplacedResidents.length})
          </h2>

          {unplacedResidents.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Alle Bewohner sind platziert
            </p>
          ) : (
            <div className="space-y-2">
              {unplacedResidents.map((resident) => (
                <Link
                  key={resident.id}
                  href={`/matching?resident=${resident.id}`}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    params.resident === resident.id
                      ? 'border-aoz-primary bg-aoz-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-aoz-primary text-white rounded-full flex items-center justify-center text-sm font-medium">
                      {resident.code.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {resident.code}
                      </p>
                      <p className="text-sm text-gray-500">
                        {getLabel(AGE_RANGE_LABELS, resident.ageRange)} ·{' '}
                        {resident.languages
                          .slice(0, 2)
                          .map((l) => getLabel(LANGUAGE_LABELS, l))
                          .join(', ')}
                      </p>
                    </div>
                  </div>
                  <span className="text-aoz-primary">→</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right panel: Matches or available units */}
        <div className="card">
          {selectedResident ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Matches für {selectedResident.code}
                </h2>
                <Link
                  href="/matching"
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Abbrechen
                </Link>
              </div>

              {matches.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Keine verfügbaren Unterkünfte
                </p>
              ) : (
                <div className="space-y-4">
                  {matches.slice(0, 10).map((match) => (
                    <MatchCard
                      key={match.unit.id}
                      match={match}
                      resident={selectedResident}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Verfügbare Unterkünfte ({availableUnits.filter(u => u.placements.length < u.totalBeds).length})
              </h2>
              <p className="text-gray-500 text-center py-8">
                Wählen Sie einen Bewohner aus, um Matches zu sehen
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function MatchCard({ match, resident }: { match: any; resident: any }) {
  const occupancy = match.unit.placements.length
  const occupancyPercent = Math.round((occupancy / match.unit.totalBeds) * 100)

  return (
    <div className="p-4 border border-gray-200 rounded-lg">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href={`/housing/${match.unit.id}`}
              className="font-semibold text-gray-900 hover:text-aoz-primary"
            >
              {match.unit.code}
            </Link>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${getScoreBgClass(
                match.overallScore
              )}`}
            >
              {match.overallScore}%
            </span>
          </div>
          <p className="text-sm text-gray-500">{match.unit.address}</p>
        </div>
      </div>

      {/* Occupancy */}
      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-500">Belegung</span>
          <span className="font-medium">
            {occupancy}/{match.unit.totalBeds}
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${getOccupancyColorClass(occupancyPercent)}`}
            style={{ width: `${occupancyPercent}%` }}
          />
        </div>
      </div>

      {/* Score breakdown */}
      <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Mitbewohner</span>
          <span className={getScoreColorClass(match.avgCompatibility)}>
            {match.avgCompatibility}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Unterkunft</span>
          <span className={getScoreColorClass(match.unitFit)}>
            {match.unitFit}%
          </span>
        </div>
      </div>

      {/* Current residents */}
      {match.unit.placements.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-1">Aktuelle Bewohner:</p>
          <div className="flex flex-wrap gap-1">
            {match.unit.placements.map((p: any) => {
              const detail = match.compatibilityDetails.find(
                (d: any) => d.resident.id === p.resident.id
              )
              return (
                <span
                  key={p.id}
                  className={`px-2 py-0.5 rounded text-xs ${getScoreBgClass(
                    detail?.score.overall || 50
                  )}`}
                  title={`${detail?.score.overall || 0}% Kompatibilität`}
                >
                  {p.resident.code}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* Concerns */}
      {match.unitConcerns.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-orange-600">
            ⚠️ {match.unitConcerns.join(' · ')}
          </p>
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
      {(!match.unit.spots || match.unit.spots.length === 0) && (
        <form action={placeResident}>
          <input type="hidden" name="residentId" value={resident.id} />
          <input type="hidden" name="housingUnitId" value={match.unit.id} />
          <input
            type="hidden"
            name="compatibilityScore"
            value={match.avgCompatibility}
          />
          <input
            type="hidden"
            name="lifestyleScore"
            value={
              match.compatibilityDetails[0]?.score.lifestyle || match.avgCompatibility
            }
          />
          <input
            type="hidden"
            name="socialScore"
            value={
              match.compatibilityDetails[0]?.score.social || match.avgCompatibility
            }
          />
          <input
            type="hidden"
            name="practicalScore"
            value={
              match.compatibilityDetails[0]?.score.practical || match.avgCompatibility
            }
          />
          <input
            type="hidden"
            name="riskScore"
            value={match.compatibilityDetails[0]?.score.risk || 0}
          />
          <button type="submit" className="btn-primary w-full">
            Platzieren
          </button>
        </form>
      )}
    </div>
  )
}

function SpotSelection({
  spots,
  resident,
  match,
}: {
  spots: any[]
  resident: any
  match: any
}) {
  // Get eligible spot types for this resident
  const eligibleTypes = getEligibleSpotTypes(
    resident.hasMedicalDocumentation,
    resident.medicalDocType
  )

  // Filter to available spots (not occupied)
  const availableSpots = spots.filter(
    (spot) => spot.placements.length === 0 && spot.status === 'AVAILABLE'
  )

  // Separate eligible and ineligible spots
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

      {eligibleSpots.map((spot) => (
        <form key={spot.id} action={placeResident} className="flex gap-2">
          <input type="hidden" name="residentId" value={resident.id} />
          <input type="hidden" name="housingUnitId" value={match.unit.id} />
          <input type="hidden" name="spotId" value={spot.id} />
          <input
            type="hidden"
            name="compatibilityScore"
            value={match.avgCompatibility}
          />
          <input
            type="hidden"
            name="lifestyleScore"
            value={match.compatibilityDetails[0]?.score.lifestyle || match.avgCompatibility}
          />
          <input
            type="hidden"
            name="socialScore"
            value={match.compatibilityDetails[0]?.score.social || match.avgCompatibility}
          />
          <input
            type="hidden"
            name="practicalScore"
            value={match.compatibilityDetails[0]?.score.practical || match.avgCompatibility}
          />
          <input
            type="hidden"
            name="riskScore"
            value={match.compatibilityDetails[0]?.score.risk || 0}
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
          <button type="submit" className="btn-primary text-sm px-3">
            Platzieren
          </button>
        </form>
      ))}

      {/* Show ineligible spots with reason */}
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
