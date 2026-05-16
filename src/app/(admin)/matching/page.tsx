import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'

export const metadata: Metadata = { title: 'Matching' }
import Link from 'next/link'
import { EMPTY_STATE_LABELS, PLACEMENT_CONCERN_LABELS, MATCHING_LABELS } from '@/lib/constants'
import { calculateCompatibility } from '@/lib/compatibility'
import { calculateApartmentProfile, calculateApartmentFit } from '@/lib/compatibility/aggregate'
import { toResidentProfile } from '@/lib/compatibility/convert'
import { validateScoreForDiscrimination } from '@/lib/compatibility/safeguards'
import type { SafeguardWarning } from '@/lib/compatibility/safeguards'
import { calculateUnitMetrics, getSimilarPlacementSuccessRate } from '@/lib/analytics/unit-metrics'
import type { Resident } from '@prisma/client'
import type { ApartmentConflict } from '@/lib/compatibility/types'
import type {
  MatchResult,
  MatchUnit,
  CompatibilityDetail,
  ResidentWithPlacement,
  UnitMatch,
} from '@/lib/matching/types'
import { ResidentSelectorPanel } from '@/components/matching/ResidentSelectorPanel'
import { UnitModePanel } from '@/components/matching/UnitModePanel'
import { MatchResultsPanel } from '@/components/matching/MatchResultsPanel'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ resident?: string; unit?: string; new?: string; q?: string; mode?: string }>
}

export default async function MatchingPage({ searchParams }: Props) {
  const params = await searchParams
  const residentQuery = (params.q || '').trim().toLowerCase()

  // All four queries are independent — fetch in parallel
  const [
    unplacedResidents,
    placedResidents,
    totalResidentCount,
    availableUnits,
  ]: [
    Resident[],
    ResidentWithPlacement[],
    number,
    MatchUnit[],
  ] = await Promise.all([
    prisma.resident.findMany({
      where: {
        status: 'ACTIVE',
        placements: { none: { status: 'ACTIVE' } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.resident.findMany({
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
    }),
    prisma.resident.count(),
    prisma.housingUnit.findMany({
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
    }),
  ])

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
            concerns.push(PLACEMENT_CONCERN_LABELS.wheelchairRequired)
          }
          if (resident.mobilityNeeds === 'GROUND_FLOOR' && !selectedUnit!.groundFloor && !selectedUnit!.elevator) {
            concerns.push(PLACEMENT_CONCERN_LABELS.groundFloorRequired)
          }
          if (resident.smokingStatus !== 'NON_SMOKER' && !selectedUnit!.smokingAllowed) {
            concerns.push(PLACEMENT_CONCERN_LABELS.smokerInNonSmokingUnit)
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
            unitConcerns.push(PLACEMENT_CONCERN_LABELS.wheelchairRequired)
            hasBlockingIssue = true
          }
          if (
            foundResident.mobilityNeeds === 'GROUND_FLOOR' &&
            !unit.groundFloor &&
            !unit.elevator
          ) {
            unitConcerns.push(PLACEMENT_CONCERN_LABELS.groundFloorRequired)
            hasBlockingIssue = true
          }
          if (
            foundResident.smokingStatus !== 'NON_SMOKER' &&
            !unit.smokingAllowed
          ) {
            unitConcerns.push(PLACEMENT_CONCERN_LABELS.smokerInNonSmokingUnit)
          }
          if (!foundResident.sharedKitchen && unit.sharedKitchen) {
            unitConcerns.push(PLACEMENT_CONCERN_LABELS.sharedKitchenOnly)
          }
          if (!foundResident.sharedBathroom && unit.sharedBathrooms > 0) {
            unitConcerns.push(PLACEMENT_CONCERN_LABELS.sharedBathroomOnly)
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

          // Run discrimination safeguard checks on pairwise scores
          const safeguardWarnings: SafeguardWarning[] = []
          const residentProfile = toResidentProfile(foundResident)
          for (const detail of compatibilityDetails) {
            const result = validateScoreForDiscrimination(
              detail.score,
              residentProfile,
              toResidentProfile(detail.resident)
            )
            safeguardWarnings.push(...result.warnings)
          }

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
            safeguardWarnings,
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

  const isNewResident = params.new === '1' && !!selectedResident
  const isUnitMode = !!selectedUnit && !selectedResident
  const fastMode = params.mode === 'fast'

  const filteredUnplacedResidents = unplacedResidents.filter((resident) => {
    if (!residentQuery) return true
    const languageText = (resident.languages || []).join(' ').toLowerCase()
    return resident.code.toLowerCase().includes(residentQuery) || languageText.includes(residentQuery)
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          {isUnitMode
            ? MATCHING_LABELS.whoFitsIn(selectedUnit?.code ?? '')
            : isNewResident
            ? MATCHING_LABELS.findUnit
            : MATCHING_LABELS.title}
        </h1>
        <div className="flex items-center justify-between">
          <p className="text-gray-500">
            {isUnitMode
              ? MATCHING_LABELS.findMatchingResidents(selectedUnit?.address ?? '')
              : isNewResident
              ? MATCHING_LABELS.step2SelectUnit(selectedResident?.code ?? '')
              : MATCHING_LABELS.findOptimalPlacement
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
            <span className="text-sm text-gray-500">{MATCHING_LABELS.profileCaptured}</span>
          </div>
          <div className="flex-1 h-0.5 bg-green-500" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-aoz-primary text-white flex items-center justify-center text-sm font-medium">
              2
            </div>
            <span className="text-sm font-medium text-gray-900">{MATCHING_LABELS.findUnit}</span>
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
                {MATCHING_LABELS.residentCreated(selectedResident?.code ?? '')}
              </h2>
              <p className="text-sm text-green-700 mt-1">
                {MATCHING_LABELS.newResidentBannerDesc}
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
                {MATCHING_LABELS.whatIfTitle(selectedResident.code)}
              </h2>
              <p className="text-sm text-blue-700 mt-1">
                {MATCHING_LABELS.whatIfCurrentPlacement(selectedResident.placements[0]?.housingUnit?.code ?? '')}{' '}
                {MATCHING_LABELS.whatIfDesc}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left panel: Unplaced residents — pushed below results on mobile when results exist */}
        <div className={(selectedResident || isUnitMode) ? 'order-last lg:order-none' : undefined}>
          <ResidentSelectorPanel
            filteredUnplacedResidents={filteredUnplacedResidents}
            totalUnplaced={unplacedResidents.length}
            placedResidents={placedResidents}
            totalResidentCount={totalResidentCount}
            residentQuery={residentQuery}
            params={params}
          />
        </div>

        {/* Right panel: Matches, Unit mode, or available units — floats to top on mobile when active */}
        <div className={`card${(selectedResident || isUnitMode) ? ' order-first lg:order-none' : ''}`}>
          {isUnitMode && selectedUnit ? (
            <UnitModePanel
              selectedUnit={selectedUnit}
              unitMatches={unitMatches}
            />
          ) : selectedResident ? (
            <MatchResultsPanel
              selectedResident={selectedResident}
              matches={matches}
              isNewResident={isNewResident}
              fastMode={fastMode}
              searchQuery={params.q}
            />
          ) : (
            <>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                {MATCHING_LABELS.availableUnitsTitle(availableUnits.filter(u => u.placements.length < u.totalBeds).length)}
              </h2>
              <p className="text-sm text-gray-500 mb-4">{MATCHING_LABELS.orSelectUnit}</p>
              <div className="space-y-2">
                {availableUnits
                  .filter(u => u.placements.length < u.totalBeds)
                  .map(u => {
                    const freeBeds = u.totalBeds - u.placements.length
                    return (
                      <Link
                        key={u.id}
                        href={`/matching?unit=${u.id}`}
                        className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-aoz-primary hover:bg-aoz-accent transition-colors"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{u.code}</p>
                          <p className="text-xs text-gray-500">{u.address}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-aoz-secondary">
                            {MATCHING_LABELS.freeBeds(freeBeds, u.totalBeds)}
                          </p>
                          {u.wheelchairAccess && <span className="text-xs text-gray-400">♿</span>}
                        </div>
                      </Link>
                    )
                  })}
              </div>
              <p className="text-xs text-gray-400 mt-4 text-center">{MATCHING_LABELS.selectResidentForMatches}</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
