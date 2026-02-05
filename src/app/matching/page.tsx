import { prisma } from '@/lib/db'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  AGE_RANGE_LABELS,
  LANGUAGE_LABELS,
  HOUSING_STATUS_LABELS,
  MEDICAL_DOC_TYPE_LABELS,
  SLEEP_SCHEDULE_LABELS,
  SMOKING_STATUS_LABELS,
  SOCIAL_STYLE_LABELS,
  getLabel,
} from '@/lib/constants'
// Removed unused score utilities - we show actual factors now
import { calculateCompatibility } from '@/lib/compatibility'
import {
  SPOT_TYPE_LABELS,
  SPOT_TYPE_ICONS,
  getEligibleSpotTypes,
} from '@/lib/config/placement-spots'
import { calculateApartmentProfile, calculateApartmentFit } from '@/lib/compatibility/aggregate'
import { toResidentProfile } from '@/lib/compatibility/convert'
import { validatePlacementFormData } from '@/lib/validation/placement'
import { logAudit } from '@/lib/audit'
import { calculateUnitMetrics, getSimilarPlacementSuccessRate } from '@/lib/analytics/unit-metrics'
import { APARTMENT_THRESHOLDS } from '@/lib/config/apartment-thresholds'
import { getScoreLevel, SCORE_THRESHOLDS } from '@/lib/config/thresholds'
import { getScoreColorClass } from '@/lib/utils'
import type { Resident } from '@prisma/client'

export const dynamic = 'force-dynamic'

// Helper to format conflict values with proper labels
function formatConflictValue(attribute: string, value: string | number): string {
  if (typeof value === 'number') {
    return value.toFixed(1)
  }
  // Use SSOT labels for enum values
  switch (attribute) {
    case 'sleepSchedule':
      return getLabel(SLEEP_SCHEDULE_LABELS, value)
    case 'smokingStatus':
      return getLabel(SMOKING_STATUS_LABELS, value)
    case 'socialStyle':
      return getLabel(SOCIAL_STYLE_LABELS, value)
    default:
      return value
  }
}

interface Props {
  searchParams: Promise<{ resident?: string; unit?: string; new?: string }>
}

async function placeResident(formData: FormData) {
  'use server'

  // SERVER-SIDE VALIDATION: Validate all inputs
  let validatedData
  try {
    validatedData = validatePlacementFormData(formData)
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Validierungsfehler: ${error.message}`)
    }
    throw new Error('Ungültige Eingabedaten')
  }

  const {
    residentId,
    housingUnitId,
    spotId,
    compatibilityScore,
    lifestyleScore,
    socialScore,
    practicalScore,
    riskScore,
    apartmentFitScore,
    hasBlockingConflicts,
    notes,
  } = validatedData

  // BLOCKING CHECK: Prevent placement if blocking conflicts exist
  if (hasBlockingConflicts) {
    throw new Error(
      'Placement blockiert: Kritische Konflikte mit Wohnungsprofil erkannt. ' +
      'Bitte wählen Sie eine besser passende Unterkunft.'
    )
  }

  // Execute all placement operations in a transaction to ensure atomicity
  // RACE CONDITION PROTECTION:
  // - All checks and updates happen within a single database transaction
  // - Database isolation level prevents concurrent transactions from seeing same state
  // - Explicit checks ensure spot/resident availability before modification
  // - If any check fails, entire transaction rolls back
  const placement = await prisma.$transaction(async (tx) => {
    // 1. Check if spot is still available (prevents double-booking)
    if (spotId) {
      const spot = await tx.placementSpot.findUnique({
        where: { id: spotId },
        include: { placements: { where: { status: 'ACTIVE' } } },
      })

      if (!spot) {
        throw new Error('Platz nicht gefunden.')
      }

      if (spot.status !== 'AVAILABLE') {
        throw new Error('Platz ist nicht mehr verfügbar.')
      }

      if (spot.placements.length > 0) {
        throw new Error('Platz ist bereits belegt.')
      }
    }

    // 2. Check if resident is still unplaced
    const resident = await tx.resident.findUnique({
      where: { id: residentId },
      include: { placements: { where: { status: 'ACTIVE' } } },
    })

    if (!resident) {
      throw new Error('Bewohner nicht gefunden.')
    }

    if (resident.placements.length > 0) {
      throw new Error('Bewohner ist bereits platziert.')
    }

    // 3. Create placement
    const newPlacement = await tx.placement.create({
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
        placementNotes: notes
          ? `Apartment Fit: ${apartmentFitScore}%\n\n${notes}`
          : `Apartment Fit: ${apartmentFitScore}%`,
      },
    })

    // 4. Update spot status if assigned
    if (spotId) {
      await tx.placementSpot.update({
        where: { id: spotId },
        data: { status: 'OCCUPIED' },
      })
    }

    // 5. Update resident status
    await tx.resident.update({
      where: { id: residentId },
      data: { status: 'PLACED' },
    })

    // 6. Check if unit is now full and update status
    const unit = await tx.housingUnit.findUnique({
      where: { id: housingUnitId },
      include: { placements: { where: { status: 'ACTIVE' } } },
    })

    if (unit && unit.placements.length + 1 >= unit.totalBeds) {
      await tx.housingUnit.update({
        where: { id: housingUnitId },
        data: { status: 'FULL' },
      })
    }

    return newPlacement
  })

  // AUDIT LOG: Record placement for compliance and debugging
  await logAudit({
    action: 'CREATE',
    entity: 'PLACEMENT',
    entityId: placement.id,
    changes: {
      residentId,
      housingUnitId,
      spotId,
      scores: {
        compatibility: compatibilityScore,
        lifestyle: lifestyleScore,
        social: socialScore,
        practical: practicalScore,
        risk: riskScore,
        apartmentFit: apartmentFitScore,
      },
      hasBlockingConflicts,
    },
    reason: notes || undefined,
  })

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

  // Get placed residents for "what-if" analysis
  const placedResidents = await prisma.resident.findMany({
    where: {
      status: 'PLACED',
      placements: { some: { status: 'ACTIVE' } },
    },
    include: {
      placements: {
        where: { status: 'ACTIVE' },
        include: { housingUnit: { select: { id: true, code: true } } },
        take: 1,
      },
    },
    orderBy: { code: 'asc' },
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

  // UNIT-SPECIFIC MODE: When unit is selected, show "who fits here"
  let selectedUnit: typeof availableUnits[0] | null = null
  let unitMatches: { resident: Resident; fitScore: number; apartmentFit: any; concerns: string[] }[] = []

  if (params.unit && !params.resident) {
    selectedUnit = availableUnits.find(u => u.id === params.unit) || null

    if (selectedUnit) {
      const currentResidents = selectedUnit.placements.map(p => p.resident)
      const apartmentProfile = calculateApartmentProfile(
        currentResidents.map(r => toResidentProfile(r as any))
      )
      apartmentProfile.unitId = selectedUnit.id

      // Calculate fit for each unplaced resident
      unitMatches = unplacedResidents
        .map(resident => {
          const residentProfile = toResidentProfile(resident as any)
          const apartmentFit = calculateApartmentFit(residentProfile, apartmentProfile)

          // Check for blocking concerns
          const concerns: string[] = []
          if (resident.mobilityNeeds === 'WHEELCHAIR' && !selectedUnit!.wheelchairAccess) {
            concerns.push('Benötigt Rollstuhlzugang')
          }
          if (resident.mobilityNeeds === 'GROUND_FLOOR' && !selectedUnit!.groundFloor && !selectedUnit!.elevator) {
            concerns.push('Benötigt Erdgeschoss')
          }
          if (resident.smokingStatus !== 'NON_SMOKER' && !selectedUnit!.smokingAllowed) {
            concerns.push('Raucher, aber Nichtraucher-Unterkunft')
          }

          return {
            resident,
            fitScore: apartmentFit.fitScore,
            apartmentFit,
            concerns,
          }
        })
        .filter(m => !m.apartmentFit.conflicts.some((c: any) => c.severity === 'BLOCKING'))
        .sort((a, b) => b.fitScore - a.fitScore)
    }
  }

  if (params.resident) {
    const foundResident = await prisma.resident.findUnique({
      where: { id: params.resident },
      include: {
        placements: {
          where: { status: 'ACTIVE' },
          include: { housingUnit: { select: { id: true, code: true } } },
          take: 1,
        },
      },
    })
    selectedResident = foundResident as any

    if (foundResident) {
      const filteredUnits = availableUnits.filter((unit) => unit.placements.length < unit.totalBeds)

      // Calculate matches with unit metrics (async)
      matches = await Promise.all(filteredUnits.map(async (unit) => {
        const currentResidents = unit.placements.map((p) => p.resident)

        // Calculate apartment aggregate profile
        const apartmentProfile = calculateApartmentProfile(
          currentResidents.map(r => toResidentProfile(r as any))
        )
        apartmentProfile.unitId = unit.id

        // Calculate apartment fit for new resident
        const apartmentFit = calculateApartmentFit(
          toResidentProfile(foundResident as any),
          apartmentProfile
        )

        // Get unit historical metrics
        let unitMetrics = null
        try {
          unitMetrics = await calculateUnitMetrics(unit.id)
        } catch (error) {
          // If metrics calculation fails, continue without them
          console.error(`Failed to calculate metrics for unit ${unit.id}:`, error)
        }

        // Get REAL success rate data from database (not fake estimates)
        let realSuccessData = null
        try {
          realSuccessData = await getSimilarPlacementSuccessRate(apartmentFit.fitScore, 10)
        } catch (error) {
          console.error(`Failed to get success rate data:`, error)
        }

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

          // Calculate unit risk penalty based on historical performance
          const unitRiskPenalty = unitMetrics
            ? (unitMetrics.riskLevel === 'CRITICAL' ? 200 :
               unitMetrics.riskLevel === 'HIGH' ? 100 :
               unitMetrics.riskLevel === 'MEDIUM' ? 50 : 0)
            : 0

          return {
            unit,
            apartmentProfile,
            apartmentFit,
            unitMetrics,
            realSuccessData, // Real data from database, not estimates
            compatibilityDetails,
            unitConcerns,
            hasBlockingIssue,
            sharedLanguageCount,
            totalRoommateConcerns,
            // For sorting: fewer issues = better, prioritize apartment fit and unit history
            sortScore: (hasBlockingIssue ? 1000 : 0) +
              (apartmentFit.conflicts.filter(c => c.severity === 'BLOCKING').length * 500) +
              (apartmentFit.conflicts.filter(c => c.severity === 'HIGH').length * 100) +
              unitRiskPenalty +  // Penalize historically problematic units
              unitConcerns.length * 10 +
              totalRoommateConcerns -
              apartmentFit.fitScore -
              sharedLanguageCount * 5 -
              (currentResidents.length === 0 ? 20 : 0) // Prefer empty units
          }
        }))

      // Sort matches by score
      matches = matches.sort((a, b) => a.sortScore - b.sortScore) // Lower score = better
    }
  }

  const isNewResident = params.new === '1' && selectedResident
  const isUnitMode = !!selectedUnit && !selectedResident

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isUnitMode
            ? `Wer passt in ${selectedUnit?.code}?`
            : isNewResident
            ? 'Unterkunft finden'
            : 'Matching'}
        </h1>
        <p className="text-gray-500">
          {isUnitMode
            ? `Finden Sie passende Bewohner für ${selectedUnit?.address}`
            : isNewResident
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

      {/* Info banner for already-placed residents */}
      {selectedResident && (selectedResident as any).placements?.length > 0 && !isNewResident && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-xl">ℹ️</span>
            <div>
              <h2 className="font-semibold text-blue-800">
                Was-wäre-wenn-Analyse für {selectedResident.code}
              </h2>
              <p className="text-sm text-blue-700 mt-1">
                Aktuell platziert in {(selectedResident as any).placements[0]?.housingUnit?.code}.
                Diese Ansicht zeigt Kompatibilität mit anderen Unterkünften.
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
                <div
                  key={resident.id}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    params.resident === resident.id
                      ? 'border-aoz-primary bg-aoz-primary/5'
                      : 'border-gray-200'
                  }`}
                >
                  <Link
                    href={`/residents/${resident.id}`}
                    className="flex items-center gap-3 flex-1 hover:opacity-80"
                  >
                    <div className="w-8 h-8 bg-aoz-primary text-white rounded-full flex items-center justify-center text-sm font-medium">
                      {resident.code.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 hover:text-aoz-primary">
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
                  </Link>
                  <Link
                    href={`/matching?resident=${resident.id}`}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      params.resident === resident.id
                        ? 'bg-aoz-primary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-aoz-primary hover:text-white'
                    }`}
                  >
                    {params.resident === resident.id ? 'Ausgewählt' : 'Matching'}
                  </Link>
                </div>
              ))}
            </div>
          )}

          {/* Placed residents section */}
          {placedResidents.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-md font-semibold text-gray-700 mb-3">
                Platzierte Bewohner ({placedResidents.length})
              </h3>
              <p className="text-xs text-gray-500 mb-3">
                Wählen Sie einen Bewohner für &quot;Was-wäre-wenn&quot;-Analyse
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {placedResidents.map((resident) => (
                  <div
                    key={resident.id}
                    className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${
                      params.resident === resident.id
                        ? 'border-aoz-primary bg-aoz-primary/5'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <Link
                      href={`/residents/${resident.id}`}
                      className="flex items-center gap-2 flex-1 hover:opacity-80"
                    >
                      <div className="w-7 h-7 bg-gray-400 text-white rounded-full flex items-center justify-center text-xs font-medium">
                        {resident.code.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          {resident.code}
                        </p>
                        <p className="text-xs text-gray-500">
                          {resident.placements[0]?.housingUnit?.code || 'Platziert'}
                        </p>
                      </div>
                    </Link>
                    <Link
                      href={`/matching?resident=${resident.id}`}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                        params.resident === resident.id
                          ? 'bg-aoz-primary text-white'
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                    >
                      Vergleichen
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right panel: Matches, Unit mode, or available units */}
        <div className="card">
          {isUnitMode && selectedUnit ? (
            <>
              {/* UNIT MODE: Show who fits in this unit */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Passende Bewohner
                  </h2>
                  <p className="text-sm text-gray-500">
                    {selectedUnit.placements.length}/{selectedUnit.totalBeds} belegt ·{' '}
                    {selectedUnit.spots?.filter(s => s.status === 'AVAILABLE').length || 0} freie Plätze
                  </p>
                </div>
                <Link
                  href="/matching"
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Zurück
                </Link>
              </div>

              {/* Current residents in unit */}
              {selectedUnit.placements.length > 0 && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                    Aktuelle Bewohner
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedUnit.placements.map((p: any) => (
                      <Link
                        key={p.id}
                        href={`/residents/${p.residentId}`}
                        className="inline-flex items-center gap-1.5 px-2 py-1 bg-white rounded border border-gray-200 text-sm hover:border-aoz-primary"
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
                  <p className="text-gray-500">Keine passenden unplatzierten Bewohner</p>
                  <Link href="/residents/new" className="btn-outline mt-4 inline-block">
                    Neuen Bewohner erfassen
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {unitMatches.slice(0, 10).map((match) => (
                    <div
                      key={match.resident.id}
                      className={`p-3 border rounded-lg ${
                        match.concerns.length > 0 ? 'border-orange-200 bg-orange-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
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
                              {match.resident.languages.slice(0, 2).map((l: string) => getLabel(LANGUAGE_LABELS, l)).join(', ')}
                            </p>
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
                            Platzieren
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
                          {match.apartmentFit.strengths.slice(0, 2).map((s: string, i: number) => (
                            <p key={i} className="text-xs text-green-600">✓ {s}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : selectedResident ? (
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

/**
 * Config-driven comparison attributes (SSOT)
 */
const COMPARISON_ATTRIBUTES = [
  { key: 'cleanlinessLevel', label: 'Sauberkeit', type: 'numeric', avgKey: 'avgCleanlinessLevel', threshold: 'cleanliness' },
  { key: 'noiseTolerance', label: 'Lärmtoleranz', type: 'numeric', avgKey: 'avgNoiseTolerance', threshold: 'noiseTolerance' },
  { key: 'choresContribution', label: 'Hausarbeit', type: 'numeric', avgKey: 'avgChoresContribution', threshold: 'choresContribution' },
  { key: 'privacyNeed', label: 'Privatsphäre', type: 'numeric', avgKey: 'avgPrivacyNeed' },
  { key: 'sleepSchedule', label: 'Schlaf', type: 'enum', dominantKey: 'dominantSleepSchedule', labels: SLEEP_SCHEDULE_LABELS },
  { key: 'socialStyle', label: 'Sozialstil', type: 'enum', dominantKey: 'dominantSocialStyle', labels: SOCIAL_STYLE_LABELS },
  { key: 'smokingStatus', label: 'Rauchen', type: 'enum', dominantKey: 'dominantSmokingStatus', labels: SMOKING_STATUS_LABELS },
] as const

function HeadToHeadComparison({
  currentResidents,
  newResident,
  apartmentProfile,
}: {
  currentResidents: any[]
  newResident: any
  apartmentProfile: any
}) {
  if (currentResidents.length === 0) return null

  // Get diff indicator for numeric comparisons
  const getDiffIndicator = (newVal: number, avgVal: number | null, thresholdKey?: string) => {
    if (avgVal === null) return null
    const diff = Math.abs(newVal - avgVal)
    if (!thresholdKey) {
      return diff <= 0.5 ? <span className="text-green-500">✓</span> : null
    }
    const thresholds = APARTMENT_THRESHOLDS[thresholdKey as keyof typeof APARTMENT_THRESHOLDS]
    if (!thresholds || typeof thresholds !== 'object') return null
    if ('BLOCKING' in thresholds && diff >= (thresholds as any).BLOCKING) {
      return <span className="text-red-500 font-bold">🚫</span>
    }
    if ('HIGH' in thresholds && diff >= (thresholds as any).HIGH) {
      return <span className="text-orange-500">⚠</span>
    }
    if (diff <= 0.5) {
      return <span className="text-green-500">✓</span>
    }
    return null
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-1.5 text-left font-semibold text-gray-600 border-b w-20">Attribut</th>
            {currentResidents.slice(0, 4).map((r: any) => (
              <th key={r.id} className="p-1.5 text-center font-medium text-gray-500 border-b" style={{ minWidth: '50px' }}>
                {r.code.slice(-3)}
              </th>
            ))}
            {currentResidents.length > 4 && (
              <th className="p-1.5 text-center text-gray-400 border-b">+{currentResidents.length - 4}</th>
            )}
            <th className="p-1.5 text-center font-semibold text-blue-700 border-b bg-blue-50">Ø</th>
            <th className="p-1.5 text-center font-semibold text-aoz-primary border-b bg-aoz-primary/10">Neu</th>
          </tr>
        </thead>
        <tbody>
          {COMPARISON_ATTRIBUTES.map((attr) => {
            const avgValue = attr.type === 'numeric'
              ? apartmentProfile[attr.avgKey as string]
              : apartmentProfile[attr.dominantKey as string]

            return (
              <tr key={attr.key} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="p-1.5 font-medium text-gray-600">{attr.label}</td>
                {currentResidents.slice(0, 4).map((r: any) => (
                  <td key={r.id} className="p-1.5 text-center text-gray-500">
                    {attr.type === 'numeric'
                      ? r[attr.key]
                      : getLabel(attr.labels as Record<string, string>, r[attr.key]).slice(0, 6)}
                  </td>
                ))}
                {currentResidents.length > 4 && <td className="p-1.5 text-center text-gray-300">…</td>}
                <td className="p-1.5 text-center font-medium bg-blue-50 text-blue-700">
                  {attr.type === 'numeric'
                    ? avgValue?.toFixed(1) || '–'
                    : avgValue ? getLabel(attr.labels as Record<string, string>, avgValue).slice(0, 6) : '–'}
                </td>
                <td className="p-1.5 text-center font-medium bg-aoz-primary/10">
                  {attr.type === 'numeric' ? (
                    <span className="inline-flex items-center gap-0.5">
                      {newResident[attr.key]}
                      {getDiffIndicator(newResident[attr.key], avgValue, 'threshold' in attr ? attr.threshold : undefined)}
                    </span>
                  ) : (
                    getLabel(attr.labels as Record<string, string>, newResident[attr.key]).slice(0, 6)
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function MatchCard({ match, resident }: { match: any; resident: any }) {
  const occupancy = match.unit.placements.length

  // Use REAL success rate data from database (not fake estimates)
  const realSuccessData = match.realSuccessData

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

      {/* Unit Historical Performance */}
      {match.unitMetrics && (
        <div className={`mb-3 p-2 rounded border ${
          match.unitMetrics.riskLevel === 'CRITICAL' ? 'bg-red-50 border-red-300' :
          match.unitMetrics.riskLevel === 'HIGH' ? 'bg-orange-50 border-orange-300' :
          match.unitMetrics.riskLevel === 'MEDIUM' ? 'bg-yellow-50 border-yellow-300' :
          'bg-green-50 border-green-300'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-700">
                Verlauf: {match.unitMetrics.label}
              </span>
              {match.unitMetrics.incidentFreeMonths > 0 && (
                <span className="text-xs text-green-600">
                  ({match.unitMetrics.incidentFreeMonths}M konfliktfrei)
                </span>
              )}
            </div>
            <span className="text-xs text-gray-600">
              {match.unitMetrics.conflictRate.toFixed(1)}/Monat Ø
            </span>
          </div>
          {match.unitMetrics.riskLevel === 'HIGH' || match.unitMetrics.riskLevel === 'CRITICAL' ? (
            <p className="text-xs text-orange-700 mt-1">
              ⚠️ {match.unitMetrics.recentConflicts} Konflikte letzte 30 Tage
            </p>
          ) : null}
        </div>
      )}

      {/* Apartment Profile Summary */}
      {match.apartmentProfile && !match.apartmentProfile.isEmpty && (
        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-blue-800 uppercase">
              Wohnungs-Profil ({match.apartmentProfile.currentResidentCount} Bewohner)
            </p>
            <span className={`text-sm font-bold ${getScoreColorClass(match.apartmentFit.fitScore)}`}>
              {match.apartmentFit.fitScore}% Passend
            </span>
          </div>

          {/* Head-to-head comparison table */}
          <HeadToHeadComparison
            currentResidents={match.unit.placements.map((p: any) => p.resident)}
            newResident={resident}
            apartmentProfile={match.apartmentProfile}
          />

          {/* Blocking/High conflicts */}
          {match.apartmentFit.conflicts.filter((c: any) => c.severity === 'BLOCKING' || c.severity === 'HIGH').length > 0 && (
            <div className="space-y-1">
              {match.apartmentFit.conflicts
                .filter((c: any) => c.severity === 'BLOCKING' || c.severity === 'HIGH')
                .map((conflict: any, i: number) => (
                  <p key={i} className={`text-xs ${
                    conflict.severity === 'BLOCKING' ? 'text-red-600 font-medium' : 'text-orange-600'
                  }`}>
                    {conflict.severity === 'BLOCKING' ? '🚫' : '⚠️'} {conflict.message}
                  </p>
                ))
              }
            </div>
          )}

          {/* Strengths */}
          {match.apartmentFit.strengths.length > 0 && match.apartmentFit.conflicts.filter((c: any) => c.severity === 'BLOCKING' || c.severity === 'HIGH').length === 0 && (
            <div className="space-y-1">
              {match.apartmentFit.strengths.slice(0, 2).map((strength: string, i: number) => (
                <p key={i} className="text-xs text-green-600">✓ {strength}</p>
              ))}
            </div>
          )}

          {/* Expandable score derivation */}
          <details className="mt-2 text-xs">
            <summary className="cursor-pointer text-blue-700 hover:text-blue-900 font-medium">
              📊 Score-Berechnung anzeigen
            </summary>
            <div className="mt-2 p-2 bg-white border border-blue-100 rounded text-gray-700">
              <p className="font-semibold mb-1">Fit Score: {match.apartmentFit.fitScore}%</p>
              <p className="text-gray-500 mb-2">Basis: 100 Punkte</p>

              {/* Conflict deductions */}
              {match.apartmentFit.conflicts.length > 0 && (
                <div className="mb-2">
                  <p className="font-medium text-red-700">Abzüge (Konflikte):</p>
                  {match.apartmentFit.conflicts.map((c: any, i: number) => (
                    <p key={i} className="ml-2">
                      • {c.attribute}: -{c.severity === 'BLOCKING' ? 40 : c.severity === 'HIGH' ? 20 : c.severity === 'MEDIUM' ? 10 : 5}
                      <span className="text-gray-500 ml-1">
                        ({formatConflictValue(c.attribute, c.residentValue)} vs {formatConflictValue(c.attribute, c.apartmentAverage)})
                      </span>
                    </p>
                  ))}
                </div>
              )}

              {/* Strength bonuses */}
              {match.apartmentFit.strengths.length > 0 && (
                <div className="mb-2">
                  <p className="font-medium text-green-700">Bonus (Stärken): +{Math.min(match.apartmentFit.strengths.length * 3, 20)}</p>
                  {match.apartmentFit.strengths.map((s: string, i: number) => (
                    <p key={i} className="ml-2 text-green-600">• {s}</p>
                  ))}
                </div>
              )}

              {/* Small group bonus */}
              {match.apartmentProfile.currentResidentCount <= 2 && (
                <p className="text-green-700">Bonus (kleine Gruppe): +5</p>
              )}

              <p className="mt-2 pt-2 border-t border-gray-200 font-semibold">
                = {match.apartmentFit.fitScore}% Gesamtpassung
              </p>
            </div>
          </details>
        </div>
      )}

      {/* Success Rate - REAL DATA from database */}
      {match.apartmentFit && !match.apartmentProfile.isEmpty && (
        <div className="mb-3 p-2 bg-purple-50 border border-purple-200 rounded">
          {realSuccessData && realSuccessData.totalPlacements > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs text-purple-700">
                  📊 Historische Daten ({realSuccessData.totalPlacements} Platzierungen):
                </span>
                <span className={`text-xs font-bold ${getScoreColorClass(realSuccessData.successRate)}`}>
                  {realSuccessData.successRate}% Erfolgsrate
                </span>
              </div>
              <p className="text-xs text-purple-600 mt-1">
                {realSuccessData.successfulPlacements}/{realSuccessData.totalPlacements} Platzierungen mit ähnlicher Kompatibilität ({match.apartmentFit.fitScore}% ±10) waren erfolgreich
              </p>
            </>
          ) : (
            <div className="text-xs text-purple-600">
              📊 Keine historischen Daten für ähnliche Kompatibilitätswerte ({match.apartmentFit.fitScore}% ±10) verfügbar.
            </div>
          )}
        </div>
      )}

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
      {(!match.unit.spots || match.unit.spots.length === 0) && (() => {
        const hasBlockingConflicts = match.apartmentFit?.conflicts.some((c: any) => c.severity === 'BLOCKING') || false
        const fitScore = match.apartmentFit?.fitScore || 100

        return (
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
            <input
              type="hidden"
              name="apartmentFitScore"
              value={fitScore}
            />
            <input
              type="hidden"
              name="hasBlockingConflicts"
              value={hasBlockingConflicts}
            />
            <button
              type="submit"
              className={`btn-primary w-full ${
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
      })()}
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

      {eligibleSpots.map((spot) => {
        const hasBlockingConflicts = match.apartmentFit?.conflicts.some((c: any) => c.severity === 'BLOCKING') || false
        const fitScore = match.apartmentFit?.fitScore || 100

        return (
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
            <input
              type="hidden"
              name="apartmentFitScore"
              value={fitScore}
            />
            <input
              type="hidden"
              name="hasBlockingConflicts"
              value={hasBlockingConflicts}
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
