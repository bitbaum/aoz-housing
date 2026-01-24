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
// Removed unused score utilities - we show actual factors now
import { calculateCompatibility } from '@/lib/compatibility'
import {
  SPOT_TYPE_LABELS,
  SPOT_TYPE_ICONS,
  getEligibleSpotTypes,
} from '@/lib/config/placement-spots'
import type { Resident } from '@prisma/client'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ resident?: string; unit?: string; new?: string }>
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

          // Calculate compatibility details with current residents
          const compatibilityDetails: any[] = []

          if (currentResidents.length > 0) {
            currentResidents.forEach((resident) => {
              const score = calculateCompatibility(
                foundResident as any,
                resident as any
              )
              compatibilityDetails.push({
                resident,
                score,
              })
            })
          }

          // Check unit fit - collect real concerns
          const unitConcerns: string[] = []
          let hasBlockingIssue = false

          if (
            foundResident.mobilityNeeds === 'WHEELCHAIR' &&
            !unit.wheelchairAccess
          ) {
            unitConcerns.push('Keine Rollstuhlzugänglichkeit')
            hasBlockingIssue = true
          }
          if (
            foundResident.mobilityNeeds === 'GROUND_FLOOR' &&
            !unit.groundFloor &&
            !unit.elevator
          ) {
            unitConcerns.push('Nicht im Erdgeschoss')
            hasBlockingIssue = true
          }
          if (
            foundResident.smokingStatus !== 'NON_SMOKER' &&
            !unit.smokingAllowed
          ) {
            unitConcerns.push('Rauchen nicht erlaubt')
          }
          if (!foundResident.sharedKitchen && unit.sharedKitchen) {
            unitConcerns.push('Nur geteilte Küche')
          }
          if (!foundResident.sharedBathroom && unit.sharedBathrooms > 0) {
            unitConcerns.push('Geteiltes Badezimmer')
          }

          // Count shared languages with current residents
          const roommateLanguages = currentResidents.flatMap((r: any) => r.languages || [])
          const sharedLanguageCount = (foundResident.languages || []).filter(
            (l: string) => roommateLanguages.includes(l)
          ).length

          // Count total concerns from roommate compatibility
          const totalRoommateConcerns = compatibilityDetails.reduce(
            (sum, d) => sum + (d.score.concerns?.length || 0), 0
          )

          return {
            unit,
            compatibilityDetails,
            unitConcerns,
            hasBlockingIssue,
            sharedLanguageCount,
            totalRoommateConcerns,
            // For sorting: fewer issues = better
            sortScore: (hasBlockingIssue ? 1000 : 0) +
              unitConcerns.length * 10 +
              totalRoommateConcerns -
              sharedLanguageCount * 5 -
              (currentResidents.length === 0 ? 20 : 0) // Prefer empty units
          }
        })
        .sort((a, b) => a.sortScore - b.sortScore) // Lower score = better
    }
  }

  const isNewResident = params.new === '1' && selectedResident

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isNewResident ? 'Unterkunft finden' : 'Matching'}
        </h1>
        <p className="text-gray-500">
          {isNewResident
            ? `Schritt 2 von 2: Wählen Sie eine Unterkunft für ${selectedResident?.code}`
            : 'Finden Sie die optimale Platzierung für Bewohner'
          }
        </p>
      </div>

      {/* Step indicator for new residents */}
      {isNewResident && (
        <div className="mb-6 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-medium">
              ✓
            </div>
            <span className="text-sm text-gray-500">Profil erfasst</span>
          </div>
          <div className="flex-1 h-0.5 bg-green-500" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-aoz-primary text-white flex items-center justify-center text-sm font-medium">
              2
            </div>
            <span className="text-sm font-medium text-gray-900">Unterkunft finden</span>
          </div>
        </div>
      )}

      {/* Welcome banner for new residents */}
      {isNewResident && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-2xl">👤</span>
            <div>
              <h2 className="font-semibold text-green-800">
                Bewohner {selectedResident?.code} erfolgreich erstellt
              </h2>
              <p className="text-sm text-green-700 mt-1">
                Wählen Sie jetzt eine passende Unterkunft. Die Unterkünfte sind nach
                Kompatibilität sortiert - oben die besten Matches.
              </p>
            </div>
          </div>
        </div>
      )}

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

  // Collect all strengths and concerns from roommate compatibility
  const allStrengths: string[] = []
  const allConcerns: string[] = []

  match.compatibilityDetails.forEach((detail: any) => {
    detail.score.strengths?.forEach((s: string) => {
      if (!allStrengths.includes(s)) allStrengths.push(s)
    })
    detail.score.concerns?.forEach((c: string) => {
      if (!allConcerns.includes(c)) allConcerns.push(c)
    })
  })

  // Count shared languages with roommates
  const roommateLanguages = match.unit.placements.flatMap((p: any) => p.resident.languages || [])
  const sharedLanguages = (resident.languages || []).filter((l: string) => roommateLanguages.includes(l))

  const totalIssues = match.unitConcerns.length + allConcerns.length
  const hasBlockingIssues = match.unitConcerns.some((c: string) =>
    c.includes('Rollstuhl') || c.includes('Erdgeschoss')
  )

  return (
    <div className={`p-4 border rounded-lg ${hasBlockingIssues ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href={`/housing/${match.unit.id}`}
              className="font-semibold text-gray-900 hover:text-aoz-primary"
            >
              {match.unit.code}
            </Link>
          </div>
          <p className="text-sm text-gray-500">{match.unit.address}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium">
            {occupancy}/{match.unit.totalBeds} belegt
          </p>
          {occupancy === 0 && (
            <p className="text-xs text-green-600">Leer</p>
          )}
        </div>
      </div>

      {/* Positive factors */}
      {(allStrengths.length > 0 || sharedLanguages.length > 0 || occupancy === 0) && (
        <div className="mb-3 space-y-1">
          {occupancy === 0 && (
            <p className="text-xs text-green-600">✓ Keine Mitbewohner - keine Konflikte</p>
          )}
          {sharedLanguages.length > 0 && (
            <p className="text-xs text-green-600">
              ✓ Gemeinsame Sprache mit {match.unit.placements.filter((p: any) =>
                (resident.languages || []).some((l: string) => (p.resident.languages || []).includes(l))
              ).length} Bewohner(n)
            </p>
          )}
          {allStrengths.slice(0, 2).map((strength, i) => (
            <p key={i} className="text-xs text-green-600">✓ {strength}</p>
          ))}
        </div>
      )}

      {/* Current residents with actual compatibility info */}
      {match.unit.placements.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-1">Aktuelle Bewohner:</p>
          <div className="space-y-1">
            {match.unit.placements.map((p: any) => {
              const detail = match.compatibilityDetails.find(
                (d: any) => d.resident.id === p.resident.id
              )
              const hasSharedLang = (resident.languages || []).some(
                (l: string) => (p.resident.languages || []).includes(l)
              )
              const concernCount = detail?.score.concerns?.length || 0
              return (
                <div key={p.id} className="flex items-center justify-between text-xs">
                  <span className="font-medium">{p.resident.code}</span>
                  <span className={concernCount > 0 ? 'text-orange-600' : 'text-green-600'}>
                    {hasSharedLang ? '✓ Sprache' : '✗ Sprache'}
                    {concernCount > 0 && ` · ${concernCount} Bedenken`}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Unit concerns (real issues) */}
      {match.unitConcerns.length > 0 && (
        <div className="mb-3">
          {match.unitConcerns.map((concern: string, i: number) => (
            <p key={i} className={`text-xs ${
              concern.includes('Rollstuhl') || concern.includes('Erdgeschoss')
                ? 'text-red-600 font-medium'
                : 'text-orange-600'
            }`}>
              ⚠️ {concern}
            </p>
          ))}
        </div>
      )}

      {/* Roommate concerns */}
      {allConcerns.length > 0 && (
        <div className="mb-3">
          {allConcerns.slice(0, 3).map((concern, i) => (
            <p key={i} className="text-xs text-orange-600">⚠️ {concern}</p>
          ))}
          {allConcerns.length > 3 && (
            <p className="text-xs text-gray-400">+{allConcerns.length - 3} weitere Bedenken</p>
          )}
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
          {/* Store actual dimension scores if available, otherwise 0 (no roommates = no comparison) */}
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
          {/* Store actual dimension scores if available, otherwise 0 (no roommates = no comparison) */}
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
