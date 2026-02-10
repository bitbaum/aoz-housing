import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'
import Link from 'next/link'
import {
  AGE_RANGE_LABELS,
  LANGUAGE_LABELS,
  EMPTY_STATE_LABELS,
  getLabel,
} from '@/lib/constants'
import { calculateCompatibility } from '@/lib/compatibility'
import { calculateApartmentProfile, calculateApartmentFit } from '@/lib/compatibility/aggregate'
import { toResidentProfile } from '@/lib/compatibility/convert'
import { calculateUnitMetrics, getSimilarPlacementSuccessRate } from '@/lib/analytics/unit-metrics'
import { getScoreColorClass } from '@/lib/utils'
import type { Resident } from '@prisma/client'
import type { ApartmentConflict } from '@/lib/compatibility/types'
import type {
  MatchResult,
  MatchUnit,
  CompatibilityDetail,
  ResidentWithPlacement,
  UnitMatch,
} from '@/lib/matching/types'
import { MatchCard } from '@/components/matching/MatchCard'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ resident?: string; unit?: string; new?: string }>
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
  const placedResidents: ResidentWithPlacement[] = await prisma.resident.findMany({
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

  // Total resident count (for empty state detection)
  const totalResidentCount = await prisma.resident.count()

  // Get available units with current residents and spots
  const availableUnits: MatchUnit[] = await prisma.housingUnit.findMany({
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
          type: { not: 'ROOM' },
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
  let selectedResident: ResidentWithPlacement | null = null
  let matches: MatchResult[] = []

  // UNIT-SPECIFIC MODE: When unit is selected, show "who fits here"
  let selectedUnit: MatchUnit | null = null
  let unitMatches: UnitMatch[] = []

  if (params.unit && !params.resident) {
    selectedUnit = availableUnits.find(u => u.id === params.unit) || null

    if (selectedUnit) {
      const currentResidents = selectedUnit.placements.map(p => p.resident)
      const apartmentProfile = calculateApartmentProfile(
        currentResidents.map(r => toResidentProfile(r))
      )
      apartmentProfile.unitId = selectedUnit.id

      // Calculate fit for each unplaced resident
      unitMatches = unplacedResidents
        .map(resident => {
          const residentProfile = toResidentProfile(resident)
          const apartmentFit = calculateApartmentFit(residentProfile, apartmentProfile)

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
        .filter(m => !m.apartmentFit.conflicts.some((c: ApartmentConflict) => c.severity === 'BLOCKING'))
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
    selectedResident = foundResident

    if (foundResident) {
      const filteredUnits = availableUnits.filter((unit) => unit.placements.length < unit.totalBeds)

      // Calculate matches with unit metrics (async)
      matches = await Promise.all(filteredUnits.map(async (unit) => {
        const currentResidents = unit.placements.map((p) => p.resident)

        // Calculate apartment aggregate profile
        const apartmentProfile = calculateApartmentProfile(
          currentResidents.map(r => toResidentProfile(r))
        )
        apartmentProfile.unitId = unit.id

        // Calculate apartment fit for new resident
        const apartmentFit = calculateApartmentFit(
          toResidentProfile(foundResident),
          apartmentProfile
        )

        // Get unit historical metrics
        let unitMetrics = null
        try {
          unitMetrics = await calculateUnitMetrics(unit.id)
        } catch (error) {
          logger.warn(`Failed to calculate metrics for unit ${unit.id}`, { unitId: unit.id })
        }

        // Get REAL success rate data from database
        let realSuccessData = null
        try {
          realSuccessData = await getSimilarPlacementSuccessRate(apartmentFit.fitScore, 10)
        } catch (error) {
          logger.warn('Failed to get success rate data')
        }

          // Calculate compatibility details with current residents
          const compatibilityDetails: CompatibilityDetail[] = []

          if (currentResidents.length > 0) {
            currentResidents.forEach((resident) => {
              const score = calculateCompatibility(
                toResidentProfile(foundResident),
                toResidentProfile(resident)
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
          const roommateLanguages = currentResidents.flatMap((r: Resident) => r.languages || [])
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
            realSuccessData,
            compatibilityDetails,
            unitConcerns,
            hasBlockingIssue,
            sharedLanguageCount,
            totalRoommateConcerns,
            sortScore: (hasBlockingIssue ? 1000 : 0) +
              (apartmentFit.conflicts.filter(c => c.severity === 'BLOCKING').length * 500) +
              (apartmentFit.conflicts.filter(c => c.severity === 'HIGH').length * 100) +
              unitRiskPenalty +
              unitConcerns.length * 10 +
              totalRoommateConcerns -
              apartmentFit.fitScore -
              sharedLanguageCount * 5 -
              (currentResidents.length === 0 ? 20 : 0)
          }
        }))

      // Sort matches by score
      matches = matches.sort((a, b) => a.sortScore - b.sortScore)
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
        <div className="flex items-center justify-between">
          <p className="text-gray-500">
            {isUnitMode
              ? `Finden Sie passende Bewohner für ${selectedUnit?.address}`
              : isNewResident
              ? `Schritt 2 von 2: Wählen Sie eine Unterkunft für ${selectedResident?.code}`
              : 'Finden Sie die optimale Platzierung für Bewohner'
            }
          </p>
          <Link
            href="/algorithm"
            className="text-sm text-aoz-secondary hover:underline whitespace-nowrap ml-4"
          >
            {EMPTY_STATE_LABELS.algorithmLink}
          </Link>
        </div>
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
      {selectedResident && selectedResident.placements.length > 0 && !isNewResident && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-xl">ℹ️</span>
            <div>
              <h2 className="font-semibold text-blue-800">
                Was-wäre-wenn-Analyse für {selectedResident.code}
              </h2>
              <p className="text-sm text-blue-700 mt-1">
                Aktuell platziert in {selectedResident.placements[0]?.housingUnit?.code}.
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
            <div className="text-center py-8">
              <p className="text-gray-500">
                {totalResidentCount === 0
                  ? EMPTY_STATE_LABELS.noResidentsAtAll
                  : EMPTY_STATE_LABELS.allResidentsPlaced}
              </p>
              {totalResidentCount === 0 && (
                <Link href="/residents/new" className="btn-outline mt-4 inline-block">
                  {EMPTY_STATE_LABELS.createResident}
                </Link>
              )}
            </div>
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
                    className={`px-3 py-2 min-h-[44px] flex items-center justify-center rounded text-sm font-medium transition-colors ${
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
                    {selectedUnit.placements.map((p) => (
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
                            className="btn-primary text-sm px-4 py-2 min-h-[44px]"
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
                <div className="text-center py-8">
                  <p className="text-gray-500">{EMPTY_STATE_LABELS.noAvailableUnits}</p>
                  <Link href="/housing/new" className="btn-outline mt-4 inline-block">
                    {EMPTY_STATE_LABELS.createHousing}
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {matches.slice(0, 10).map((match) => (
                    <MatchCard
                      key={match.unit.id}
                      match={match}
                      resident={selectedResident!}
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
