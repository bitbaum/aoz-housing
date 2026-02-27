import type { HousingUnit, Resident } from '@prisma/client'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  SPOT_TYPE_ICONS,
} from '@/lib/config/placement-spots'
import { getEligibleSpotTypes } from '@/lib/config/placement-spots'
import {
  PlacementActions,
  QuickCheckIn,
  SatisfactionHistory,
  ResidentProfileSidebar,
  ResidentIncidents,
  CompatibleMatchesCard,
  TopCompatibilitiesCard,
  PlacementHistoryCard,
} from '@/components/residents'
import type { UnitCompatibilityData } from '@/components/residents/TransferRecommendations'
import { calculateCompatibility } from '@/lib/compatibility/scoring'
import { toResidentProfile } from '@/lib/compatibility/convert'
import { calculateApartmentProfile, calculateApartmentFit } from '@/lib/compatibility/aggregate'
import {
  AGE_RANGE_LABELS,
  GENDER_LABELS,
  FAMILY_STATUS_LABELS,
  RESIDENT_STATUS_LABELS,
  getLabel,
} from '@/lib/constants'
import { getPlacementCheckIns } from '@/lib/actions'
import {
  getStatusBadgeClass,
  getScoreLabel,
  getScoreColorClass,
  formatDate,
} from '@/lib/utils'
import { SuccessToast } from '@/components/ui/SuccessToast'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ action?: string }>
}

export default async function ResidentDetailPage({ params, searchParams }: Props) {
  const { id } = await params
  const query = await searchParams

  const resident = await prisma.resident.findUnique({
    where: { id },
    include: {
      placements: {
        include: {
          housingUnit: true,
          spot: true,
        },
        orderBy: { startDate: 'desc' },
      },
      incidentsAsSubject: {
        include: {
          housingUnit: true,
        },
        orderBy: { date: 'desc' },
        take: 10,
      },
      incidentsReported: {
        include: {
          housingUnit: true,
        },
        orderBy: { date: 'desc' },
        take: 10,
      },
      assessments: {
        include: {
          comparedWith: true,
        },
        orderBy: { overallScore: 'desc' },
        take: 5,
      },
    },
  })

  // Fetch available housing units with their available spots and current placements for transfer
  const availableUnits = await prisma.housingUnit.findMany({
    where: {
      status: { in: ['AVAILABLE', 'FULL'] },
    },
    include: {
      spots: {
        where: {
          status: 'AVAILABLE',
          type: { not: 'ROOM' }, // Only assignable spots
        },
        orderBy: { code: 'asc' },
      },
      placements: {
        where: { status: 'ACTIVE' },
        include: { resident: true },
      },
    },
    orderBy: { code: 'asc' },
  })

  if (!resident) {
    notFound()
  }

  const currentPlacement = resident.placements.find((p) => p.status === 'ACTIVE')
  const pastPlacements = resident.placements.filter((p) => p.status !== 'ACTIVE')

  // Fetch check-ins for quick check-in component (placed residents only)
  let checkInCount = 0
  let lastSatisfaction: number | undefined
  let weeksSinceStart = 0

  if (currentPlacement) {
    const checkIns = await getPlacementCheckIns(currentPlacement.id)
    checkInCount = checkIns.length
    if (checkIns.length > 0) {
      lastSatisfaction = checkIns[0].overallSatisfaction
    }
    weeksSinceStart = Math.floor(
      (Date.now() - new Date(currentPlacement.startDate).getTime()) / (7 * 24 * 60 * 60 * 1000)
    )
  }

  // For unplaced residents: calculate compatible matches
  let compatibleUnits: { unit: HousingUnit; fitScore: number; residents: number }[] = []
  let compatibleResidents: { resident: Resident; score: number }[] = []

  // For placed residents: full compatibility data for transfer recommendations
  let unitCompatibility: Record<string, UnitCompatibilityData> = {}

  // Create resident profile for matching calculations
  const residentProfile = toResidentProfile(resident)

  if (currentPlacement) {
    // Calculate full compatibility data for all available units (for transfer recommendations)
    // This includes: apartment fit score, pairwise compatibility with each resident
    for (const unit of availableUnits) {
      if (unit.id === currentPlacement.housingUnitId) continue // Skip current unit
      if (unit.spots.length === 0) continue // No available spots

      const currentResidentProfiles = unit.placements.map(p => ({
        profile: toResidentProfile(p.resident),
        resident: p.resident,
      }))

      // Calculate apartment-level fit
      const apartmentProfile = calculateApartmentProfile(currentResidentProfiles.map(r => r.profile))
      const fit = calculateApartmentFit(residentProfile, apartmentProfile)

      // Calculate pairwise compatibility with each resident in the unit
      const residentsWithCompatibility = currentResidentProfiles.map(({ profile, resident: otherResident }) => {
        const pairwise = calculateCompatibility(residentProfile, profile)
        // Extract key factors from the pairwise assessment
        const keyFactors: string[] = []
        if (pairwise.lifestyle >= 70) keyFactors.push('Ähnlicher Lebensstil')
        else if (pairwise.lifestyle < 40) keyFactors.push('Unterschiedlicher Lebensstil')
        if (pairwise.social >= 70) keyFactors.push('Gute soziale Passung')
        else if (pairwise.social < 40) keyFactors.push('Soziale Unterschiede')
        if (pairwise.practical >= 70) keyFactors.push('Praktisch kompatibel')
        // Add strengths if any
        if (pairwise.strengths.length > 0) {
          keyFactors.push(...pairwise.strengths.slice(0, 2))
        }

        return {
          id: otherResident.id,
          code: otherResident.code,
          compatibilityScore: Math.round(pairwise.overall),
          keyFactors: keyFactors.slice(0, 3), // Limit to 3 factors
        }
      })

      unitCompatibility[unit.id] = {
        fitScore: fit.fitScore,
        strengths: fit.strengths,
        concerns: fit.warnings,
        residents: residentsWithCompatibility,
      }
    }
  }

  if (!currentPlacement) {
    // Get units with current residents for apartment-level matching
    const unitsWithResidents = await prisma.housingUnit.findMany({
      where: { status: { in: ['AVAILABLE', 'FULL'] } },
      include: {
        placements: {
          where: { status: 'ACTIVE' },
          include: { resident: true },
        },
        spots: { where: { status: 'AVAILABLE' } },
      },
    })

    // Calculate fit for each unit
    compatibleUnits = unitsWithResidents
      .filter(u => u.spots.length > 0) // Has available spots
      .map(unit => {
        const currentResidents = unit.placements.map(p => toResidentProfile(p.resident))
        const apartmentProfile = calculateApartmentProfile(currentResidents)
        const fit = calculateApartmentFit(residentProfile, apartmentProfile)
        return { unit, fitScore: fit.fitScore, residents: currentResidents.length }
      })
      .sort((a, b) => b.fitScore - a.fitScore)
      .slice(0, 3)

    // Get other unplaced residents for pairing
    const otherUnplaced = await prisma.resident.findMany({
      where: {
        id: { not: resident.id },
        status: 'ACTIVE',
        placements: { none: { status: 'ACTIVE' } },
      },
    })

    // Calculate pairwise compatibility
    compatibleResidents = otherUnplaced
      .map(other => {
        const otherProfile = toResidentProfile(other)
        const compat = calculateCompatibility(residentProfile, otherProfile)
        return { resident: other, score: compat.overall }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
  }

  return (
    <div>
      <SuccessToast
        triggers={[
          { param: 'placed', message: 'Bewohner erfolgreich platziert' },
          { param: 'checkin', message: 'Check-in erfolgreich gespeichert' },
        ]}
      />
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/residents"
              className="text-gray-500 hover:text-gray-700"
            >
              Bewohner
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900">{resident.code}</span>
          </div>
          <div className="flex items-center gap-4 mt-2">
            <div className="w-12 h-12 bg-aoz-primary text-white rounded-full flex items-center justify-center font-semibold text-lg">
              {resident.code.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                {resident.code}
              </h1>
              <p className="text-gray-500">
                {getLabel(AGE_RANGE_LABELS, resident.ageRange)} ·{' '}
                {getLabel(GENDER_LABELS, resident.gender)} ·{' '}
                {getLabel(FAMILY_STATUS_LABELS, resident.familyStatus)}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`badge ${getStatusBadgeClass(resident.status)}`}>
            {getLabel(RESIDENT_STATUS_LABELS, resident.status)}
          </span>
          {currentPlacement && (
            <Link href={`/residents/${resident.id}?action=transfer#placement-actions`} className="btn-primary">
              Verlegen
            </Link>
          )}
          <Link href={`/residents/${resident.id}/edit`} className="btn-outline">
            Bearbeiten
          </Link>
          {!currentPlacement && (
            <Link href={`/matching?resident=${resident.id}`} className="btn-primary">
              Platzieren
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Profile details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Placement */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Aktuelle Platzierung
            </h2>
            {currentPlacement ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-green-600 text-white rounded-lg flex items-center justify-center">
                      {'\u{1F3E0}'}
                    </div>
                    <div>
                      <Link
                        href={`/housing/${currentPlacement.housingUnitId}`}
                        className="font-medium text-gray-900 hover:text-aoz-primary"
                      >
                        {currentPlacement.housingUnit.code}
                      </Link>
                      <p className="text-sm text-gray-500">
                        {currentPlacement.housingUnit.address}
                      </p>
                      {currentPlacement.spot && (
                        <p className="text-sm text-gray-500">
                          {SPOT_TYPE_ICONS[currentPlacement.spot.type as keyof typeof SPOT_TYPE_ICONS]}{' '}
                          {currentPlacement.spot.label || currentPlacement.spot.code}
                        </p>
                      )}
                      <p className="text-sm text-gray-500">
                        Seit {formatDate(currentPlacement.startDate)}
                      </p>
                    </div>
                  </div>
                  {currentPlacement.compatibilityScore && (
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Kompatibilität</p>
                      <p
                        className={`text-lg font-semibold ${getScoreColorClass(
                          currentPlacement.compatibilityScore
                        )}`}
                      >
                        {Math.round(currentPlacement.compatibilityScore)}% -{' '}
                        {getScoreLabel(currentPlacement.compatibilityScore)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Quick Check-in - Primary action for case workers */}
                <div className="pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Schnell-Check-in
                  </h3>
                  <QuickCheckIn
                    placementId={currentPlacement.id}
                    residentId={resident.id}
                    checkInCount={checkInCount}
                    weeksSinceStart={weeksSinceStart}
                    lastSatisfaction={lastSatisfaction}
                  />
                </div>

                {/* Actions Section - Client Component */}
                <PlacementActions
                  placementId={currentPlacement.id}
                  residentId={resident.id}
                  currentUnitId={currentPlacement.housingUnitId}
                  hasMedicalDocumentation={resident.hasMedicalDocumentation}
                  availableUnits={availableUnits.map((u) => ({
                    id: u.id,
                    code: u.code,
                    address: u.address,
                    spots: u.spots.map((s) => ({
                      id: s.id,
                      code: s.code,
                      type: s.type,
                      label: s.label,
                    })),
                  }))}
                  eligibleSpotTypes={getEligibleSpotTypes(
                    resident.hasMedicalDocumentation,
                    resident.medicalDocType
                  )}
                  unitCompatibility={unitCompatibility}
                  recentIncidents={resident.incidentsAsSubject.map((i) => ({
                    id: i.id,
                    date: i.date,
                    type: i.type,
                    description: i.description,
                  }))}
                  initialCompatibilityScore={currentPlacement.compatibilityScore}
                  initialAction={query.action === 'transfer' ? 'transfer' : query.action === 'end' ? 'end' : undefined}
                />
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">Nicht platziert</p>
                <Link
                  href={`/matching?resident=${resident.id}`}
                  className="btn-primary"
                >
                  Passende Unterkunft finden
                </Link>
              </div>
            )}
          </div>

          {/* Compatible Matches for Unplaced Residents */}
          {!currentPlacement && (
            <CompatibleMatchesCard
              residentId={resident.id}
              compatibleUnits={compatibleUnits}
              compatibleResidents={compatibleResidents}
            />
          )}

          {/* Satisfaction Check-ins History */}
          {currentPlacement && (
            <SatisfactionHistory placementId={currentPlacement.id} />
          )}

          {/* Compatibility with current roommates */}
          <TopCompatibilitiesCard assessments={resident.assessments} />

          {/* Incidents */}
          <ResidentIncidents
            incidentsAsSubject={resident.incidentsAsSubject}
            incidentsReportedCount={resident.incidentsReported.length}
            currentPlacement={currentPlacement ? { id: currentPlacement.id, housingUnitId: currentPlacement.housingUnitId } : null}
            residentId={resident.id}
          />

          {/* Placement History */}
          <PlacementHistoryCard placements={pastPlacements} />
        </div>

        {/* Right column: Profile attributes */}
        <ResidentProfileSidebar resident={resident} />
      </div>
    </div>
  )
}
