import type { Metadata } from 'next'
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
  SatisfactionHistory,
  ResidentProfileSidebar,
  ResidentIncidents,
  CompatibleMatchesCard,
  TopCompatibilitiesCard,
  PlacementHistoryCard,
  LearningRecordsCard,
  CareTeamCard,
  CareWorkspace,
  ResidentDocumentsCard,
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
  RESIDENT_DETAIL_LABELS,
  getLabel,
} from '@/lib/constants'
import { getPlacementCheckIns } from '@/lib/actions'
import {
  getStatusBadgeClass,
  getScoreLabel,
  getScoreColorClass,
  formatDate,
  weeksBetween,
} from '@/lib/utils'
import { QUERY_LIMITS } from '@/lib/config/thresholds'
import { residentInitials, residentName } from '@/lib/utils/resident-name'
import { getCurrentUser, hasPermission } from '@/lib/auth'
import { getCareTeam, listAssignableStaff, listCareAttributes, listResidentAppointments } from '@/lib/actions/care'
import { writableCareDomains } from '@/lib/config/care'
import { listResidentDocuments } from '@/lib/actions/documents'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const resident = await prisma.resident.findUnique({
    where: { id },
    select: { code: true, displayName: true },
  })
  return { title: resident ? residentName(resident) : 'Klient*in' }
}

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ action?: string }>
}

export default async function ResidentDetailPage({ params, searchParams }: Props) {
  const { id } = await params
  const query = await searchParams

  const staff = await getCurrentUser()
  const canReadHousing = staff ? hasPermission(staff, 'housing:read') : false
  const canWriteResidents = staff ? hasPermission(staff, 'residents:write') : false
  const canWritePlacements = staff ? hasPermission(staff, 'placements:write') : false
  const canWriteIncidents = staff ? hasPermission(staff, 'incidents:write') : false
  const canWriteLearning = staff ? hasPermission(staff, 'learning:write') : false
  const canReadDocuments = staff ? hasPermission(staff, 'documents:read') : false
  const canWriteDocuments = staff ? hasPermission(staff, 'documents:write') : false

  // resident and availableUnits are independent — fetch in parallel
  const [resident, availableUnits, careSeats, assignableStaff, careAttributes, careAppointments, documents] = await Promise.all([
    prisma.resident.findUnique({
      where: { id },
      include: {
        placements: {
          include: {
            housingUnit: true,
            spot: true,
          },
          orderBy: { startDate: 'desc' },
        },
        learningRecords: { orderBy: { updatedAt: 'desc' } },
        incidentsAsSubject: {
          include: {
            housingUnit: true,
          },
          orderBy: { date: 'desc' },
          take: QUERY_LIMITS.residentHistory,
        },
        incidentsReported: {
          include: {
            housingUnit: true,
          },
          orderBy: { date: 'desc' },
          take: QUERY_LIMITS.residentHistory,
        },
        assessments: {
          include: {
            comparedWith: true,
          },
          orderBy: { overallScore: 'desc' },
          take: 5,
        },
      },
    }),
    // Available units for placement/transfer actions
    canWritePlacements
      ? prisma.housingUnit.findMany({
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
      : Promise.resolve([]),
    getCareTeam(id),
    listAssignableStaff(),
    listCareAttributes(id),
    listResidentAppointments(id),
    // Only fetched when the viewer may see them — the list is cheap, but
    // "fetch then hide" is how a payload leaks what the markup conceals.
    canReadDocuments ? listResidentDocuments(id) : Promise.resolve([]),
  ])

  if (!resident) {
    notFound()
  }

  const currentPlacement = resident.placements.find((p) => p.status === 'ACTIVE')
  const pastPlacements = resident.placements.filter((p) => p.status !== 'ACTIVE')

  // The check-in prefetch that used to live here fed only the always-on
  // satisfaction widget. With capture moved into closing an appointment, it
  // was a database round-trip on every client page whose result nothing read.
  // SatisfactionHistory below loads its own.

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
        if (pairwise.lifestyle >= 70) keyFactors.push(RESIDENT_DETAIL_LABELS.lifestyleSimilar)
        else if (pairwise.lifestyle < 40) keyFactors.push(RESIDENT_DETAIL_LABELS.lifestyleDifferent)
        if (pairwise.social >= 70) keyFactors.push(RESIDENT_DETAIL_LABELS.socialGood)
        else if (pairwise.social < 40) keyFactors.push(RESIDENT_DETAIL_LABELS.socialDifferent)
        if (pairwise.practical >= 70) keyFactors.push(RESIDENT_DETAIL_LABELS.practicalCompat)
        // Add strengths if any
        if (pairwise.strengths.length > 0) {
          keyFactors.push(...pairwise.strengths.slice(0, 2))
        }

        return {
          id: otherResident.id,
          code: otherResident.code,
          displayName: otherResident.displayName,
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

  if (!currentPlacement && canWritePlacements) {
    // Both queries depend only on resident.id — fetch in parallel
    const [unitsWithResidents, otherUnplaced] = await Promise.all([
      prisma.housingUnit.findMany({
        where: { status: { in: ['AVAILABLE', 'FULL'] } },
        include: {
          placements: {
            where: { status: 'ACTIVE' },
            include: { resident: true },
          },
          spots: { where: { status: 'AVAILABLE' } },
        },
      }),
      prisma.resident.findMany({
        where: {
          id: { not: resident.id },
          status: 'ACTIVE',
          placements: { none: { status: 'ACTIVE' } },
        },
      }),
    ])

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
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <Link
              href="/residents"
              className="text-ui-muted hover:text-ui-muted"
            >
              {RESIDENT_DETAIL_LABELS.breadcrumb}
            </Link>
            <span className="text-ui-muted">/</span>
            {/* The login code IS the identity here — staff read it out
                loud to residents. resident-code-intentional */}
            <span className="text-ui-text">{resident.code}</span>
          </div>
          <div className="flex items-center gap-4 mt-2">
            <div className="avatar-lg font-semibold">
              {residentInitials(resident)}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-ui-text">
                {residentName(resident)}
              </h1>
              <p className="text-ui-muted">
                {getLabel(AGE_RANGE_LABELS, resident.ageRange)} ·{' '}
                {getLabel(GENDER_LABELS, resident.gender)} ·{' '}
                {getLabel(FAMILY_STATUS_LABELS, resident.familyStatus)}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className={`badge ${getStatusBadgeClass(resident.status)}`}>
            {getLabel(RESIDENT_STATUS_LABELS, resident.status)}
          </span>
          {/* This page already computed the permission flags; these three
              header buttons were the ones still ignoring them, so a Jobcoach
              was offered Verlegen / Bearbeiten / Platzieren and got a generic
              crash on click. */}
          {canWritePlacements && currentPlacement && (
            <Link href={`/residents/${resident.id}?action=transfer#placement-actions`} className="btn-primary">
              {RESIDENT_DETAIL_LABELS.transferBtn}
            </Link>
          )}
          {canWriteResidents && (
            <Link href={`/residents/${resident.id}/edit`} className="btn-outline">
              {RESIDENT_DETAIL_LABELS.editBtn}
            </Link>
          )}
          {canWritePlacements && !currentPlacement && (
            <Link href={`/matching?resident=${resident.id}`} className="btn-primary">
              {RESIDENT_DETAIL_LABELS.placeBtn}
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Profile details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Placement */}
          <div className="card">
            <h2 className="text-lg font-semibold text-ui-text mb-4">
              {RESIDENT_DETAIL_LABELS.currentPlacementTitle}
            </h2>
            {currentPlacement ? (
              <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 bg-status-success/10 rounded-lg">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 shrink-0 bg-status-success text-ui-on-accent rounded-lg flex items-center justify-center">
                      {'\u{1F3E0}'}
                    </div>
                    <div className="min-w-0">
                      {canReadHousing ? (
                        <Link
                          href={`/housing/${currentPlacement.housingUnitId}`}
                          className="inline-flex items-center py-2 -my-2 font-medium text-ui-text hover:text-brand-primary"
                        >
                          {currentPlacement.housingUnit.code}
                        </Link>
                      ) : (
                        <span className="inline-flex items-center py-2 -my-2 font-medium text-ui-text">
                          {currentPlacement.housingUnit.code}
                        </span>
                      )}
                      <p className="text-sm text-ui-muted">
                        {currentPlacement.housingUnit.address}
                      </p>
                      {currentPlacement.spot && (
                        <p className="text-sm text-ui-muted">
                          {SPOT_TYPE_ICONS[currentPlacement.spot.type as keyof typeof SPOT_TYPE_ICONS]}{' '}
                          {currentPlacement.spot.label || currentPlacement.spot.code}
                        </p>
                      )}
                      <p className="text-sm text-ui-muted">
                        {RESIDENT_DETAIL_LABELS.since}{formatDate(currentPlacement.startDate)}
                      </p>
                    </div>
                  </div>
                  {currentPlacement.compatibilityScore && (
                    <div className="text-left sm:text-right shrink-0">
                      <p className="text-sm text-ui-muted">{RESIDENT_DETAIL_LABELS.compatibility}</p>
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

                {/* A satisfaction scale used to sit here permanently, so a
                    caseworker could record how someone felt without having
                    spoken to them. Recording it now belongs to closing an
                    appointment (see CareWorkspace); reading the history stays
                    here, in SatisfactionHistory below. */}

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
                  canWriteCheckIn={canWriteResidents}
                  canWritePlacement={canWritePlacements}
                />
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-ui-muted mb-4">{RESIDENT_DETAIL_LABELS.notPlaced}</p>
                {canWritePlacements && (
                  <Link
                    href={`/matching?resident=${resident.id}`}
                    className="btn-primary"
                  >
                    {RESIDENT_DETAIL_LABELS.findUnit}
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Compatible Matches for Unplaced Residents */}
          {!currentPlacement && canWritePlacements && (
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
            canWriteIncidents={canWriteIncidents}
          />

          <LearningRecordsCard
            residentId={resident.id}
            records={resident.learningRecords}
            canWrite={canWriteLearning}
          />

          <CareTeamCard
            residentId={resident.id}
            seats={careSeats}
            staffOptions={assignableStaff}
            canWrite={false}
            writableDomains={staff ? writableCareDomains(staff) : []}
            title="Betreuungsteam"
            empty="Noch niemand zugewiesen."
          />

          {canReadDocuments && (
            <ResidentDocumentsCard
              residentId={resident.id}
              documents={documents}
              canWrite={canWriteDocuments}
            />
          )}

          <CareWorkspace
            residentId={resident.id}
            attributes={careAttributes}
            appointments={careAppointments}
            writableDomains={staff ? writableCareDomains(staff) : []}
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
