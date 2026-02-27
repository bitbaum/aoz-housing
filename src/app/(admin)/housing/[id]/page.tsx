import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  HOUSING_STATUS_LABELS,
  HARMONY_STATUS_LABELS,
} from '@/lib/constants'
import {
  getScoreLabel,
  getScoreColorClass,
  formatDate,
  getDateDaysAgo,
  getHarmonyStatus,
  type HarmonyStatus,
} from '@/lib/utils'
import { RoomVisualizationWithPlacement } from '@/components/housing/RoomVisualizationWithPlacement'
import { CompatibilityMatrixInteractive } from '@/components/housing/CompatibilityMatrixInteractive'
import { ApartmentProfileCard } from '@/components/housing/ApartmentProfileCard'
import { ProblemDetectionCard } from '@/components/housing/ProblemDetectionCard'
import { UnitOverviewCards } from '@/components/housing/UnitOverviewCards'
import { UnitSidebar } from '@/components/housing/UnitSidebar'
import { UnitIncidentSection } from '@/components/housing/UnitIncidentSection'
import { WhoFitsHereCard } from '@/components/housing/WhoFitsHereCard'
import { calculateApartmentProfile, calculateApartmentFit } from '@/lib/compatibility/aggregate'
import { toResidentProfile } from '@/lib/compatibility/convert'
import type { Resident, CompatibilityAssessment } from '@prisma/client'
import type { ApartmentConflict } from '@/lib/compatibility/types'
import type { HousingSpot } from '@/components/housing/types'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function HousingDetailPage({ params }: Props) {
  const { id } = await params

  const unit = await prisma.housingUnit.findUnique({
    where: { id },
    include: {
      spots: {
        include: {
          placements: {
            where: { status: 'ACTIVE' },
            include: { resident: true },
          },
          childSpots: {
            include: {
              placements: {
                where: { status: 'ACTIVE' },
                include: { resident: true },
              },
            },
          },
        },
        orderBy: { code: 'asc' },
      },
      placements: {
        where: { status: 'ACTIVE' },
        include: {
          resident: true,
        },
        orderBy: { startDate: 'desc' },
      },
      incidents: {
        orderBy: { date: 'desc' },
        take: 20,
        include: {
          reportedBy: true,
          subject: true,
        },
      },
    },
  })

  if (!unit) {
    notFound()
  }

  // Get compatibility assessments between current residents
  const residentIds = unit.placements.map(p => p.residentId)
  const compatibilityScores = residentIds.length > 1
    ? await prisma.compatibilityAssessment.findMany({
        where: {
          residentId: { in: residentIds },
          comparedWithId: { in: residentIds },
        },
      })
    : []

  // Calculate harmony status using shared utility
  const avgCompatibility = compatibilityScores.length > 0
    ? compatibilityScores.reduce((sum, s) => sum + s.overallScore, 0) / compatibilityScores.length
    : 70
  const recentConflicts = unit.incidents.filter((i: { category: string; date: Date | string }) =>
    i.category === 'INTERPERSONAL' &&
    new Date(i.date) > getDateDaysAgo(30)
  ).length
  const harmonyStatus = getHarmonyStatus(avgCompatibility, recentConflicts)

  // Split incidents by category
  const interpersonalIncidents = unit.incidents.filter(
    i => i.category === 'INTERPERSONAL' || i.category === 'SAFETY'
  )
  const maintenanceIncidents = unit.incidents.filter(
    i => i.category === 'MAINTENANCE'
  )

  // Analyze frequent subjects (troublemaker detection)
  const subjectCounts: Record<string, { code: string; count: number }> = {}
  for (const incident of unit.incidents) {
    if (incident.subject) {
      const id = incident.subjectId!
      if (!subjectCounts[id]) {
        subjectCounts[id] = { code: incident.subject.code, count: 0 }
      }
      subjectCounts[id].count++
    }
  }
  const frequentSubjects = Object.entries(subjectCounts)
    .map(([id, data]) => ({ id, ...data }))
    .filter(s => s.count >= 2)
    .sort((a, b) => b.count - a.count)

  const occupancy = unit.placements.length

  // Calculate who fits in this unit (only if there's space)
  let compatibleResidents: { resident: Resident; fitScore: number; strengths: string[]; concerns: string[] }[] = []
  const hasAvailableSpace = unit.placements.length < unit.totalBeds

  if (hasAvailableSpace) {
    // Get unplaced residents
    const unplacedResidents = await prisma.resident.findMany({
      where: {
        status: 'ACTIVE',
        placements: { none: { status: 'ACTIVE' } },
      },
    })

    if (unplacedResidents.length > 0) {
      // Calculate apartment profile from current residents
      const currentResidents = unit.placements.map(p => p.resident)
      const apartmentProfile = calculateApartmentProfile(
        currentResidents.map(r => toResidentProfile(r))
      )
      apartmentProfile.unitId = unit.id

      // Calculate fit for each unplaced resident
      compatibleResidents = unplacedResidents
        .map(resident => {
          const residentProfile = toResidentProfile(resident)
          const fit = calculateApartmentFit(residentProfile, apartmentProfile)

          // Check for blocking concerns based on unit requirements
          const concerns: string[] = []
          if (resident.mobilityNeeds === 'WHEELCHAIR' && !unit.wheelchairAccess) {
            concerns.push('Benötigt Rollstuhlzugang')
          }
          if (resident.mobilityNeeds === 'GROUND_FLOOR' && !unit.groundFloor && !unit.elevator) {
            concerns.push('Benötigt Erdgeschoss')
          }
          if (resident.smokingStatus !== 'NON_SMOKER' && !unit.smokingAllowed) {
            concerns.push('Raucher, aber Nichtraucher-Unterkunft')
          }

          // Add apartment-level blocking conflicts to concerns
          fit.conflicts
            .filter((c: ApartmentConflict) => c.severity === 'BLOCKING')
            .forEach((c: ApartmentConflict) => concerns.push(c.message))

          return {
            resident,
            fitScore: fit.fitScore,
            strengths: fit.strengths.slice(0, 2),
            concerns,
          }
        })
        .filter(m => !m.concerns.some(c => c.includes('Rollstuhl') || c.includes('Erdgeschoss')))
        .sort((a, b) => b.fitScore - a.fitScore)
        .slice(0, 5)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/housing"
              className="text-gray-500 hover:text-gray-700"
            >
              Unterkünfte
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900">{unit.code}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mt-2">{unit.address}</h1>
        </div>
        <div className="flex items-center gap-3">
          <HarmonyBadge status={harmonyStatus} />
          <StatusBadge status={unit.status} />
          <Link href={`/housing/${unit.id}/edit`} className="btn-outline">
            Bearbeiten
          </Link>
        </div>
      </div>

      {/* Overview Cards */}
      <UnitOverviewCards
        occupancy={occupancy}
        totalBeds={unit.totalBeds}
        totalRooms={unit.totalRooms}
        privateRooms={unit.privateRooms}
        sharedRooms={unit.sharedRooms}
        interpersonalIncidents={interpersonalIncidents}
        maintenanceIncidents={maintenanceIncidents}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Residents */}
        <div className="lg:col-span-2 space-y-6">
          {/* Room/Bed Visualization */}
          {unit.spots && unit.spots.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Zimmer & Plätze
                </h2>
                <Link href={`/housing/${unit.id}/spots`} className="btn-outline text-sm">
                  Plätze verwalten
                </Link>
              </div>
              <RoomVisualizationWithPlacement
                spots={unit.spots as unknown as HousingSpot[]}
                housingUnitId={unit.id}
                compatibleResidents={compatibleResidents}
              />
            </div>
          )}

          {/* Current Residents (legacy view for units without spots) */}
          {(!unit.spots || unit.spots.length === 0) && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Aktuelle Bewohner
                </h2>
                <div className="flex gap-2">
                  <Link href={`/housing/${unit.id}/spots`} className="btn-primary text-sm">
                    Plätze definieren
                  </Link>
                  <Link href={`/matching?unit=${unit.id}`} className="btn-outline text-sm">
                    Bewohner platzieren
                  </Link>
                </div>
              </div>

              {unit.placements.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Keine aktiven Bewohner
                </p>
              ) : (
                <div className="space-y-3">
                  {unit.placements.map((placement) => (
                    <ResidentCard
                      key={placement.id}
                      placement={placement}
                      compatibilityScores={compatibilityScores}
                      otherResidentIds={residentIds.filter(id => id !== placement.residentId)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Apartment Profile Card */}
          {unit.placements.length > 0 && (
            <ApartmentProfileCard
              residents={unit.placements.map(p => p.resident)}
            />
          )}

          {/* Problem Detection Card */}
          {unit.placements.length > 1 && (
            <ProblemDetectionCard
              residents={unit.placements.map(p => p.resident)}
              compatibilityScores={compatibilityScores}
              housingUnitId={unit.id}
            />
          )}

          {/* Who Fits Here - Only show if there's available space */}
          {hasAvailableSpace && (
            <WhoFitsHereCard
              unitId={unit.id}
              availableSpaces={unit.totalBeds - unit.placements.length}
              compatibleResidents={compatibleResidents}
            />
          )}

          {/* Compatibility Matrix */}
          {unit.placements.length > 1 && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Kompatibilitätsmatrix
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Klicken Sie auf eine Zelle, um Details zur Kompatibilität zu sehen
              </p>
              <CompatibilityMatrixInteractive
                residents={unit.placements.map(p => p.resident)}
                scores={compatibilityScores}
              />
            </div>
          )}

          {/* Incidents */}
          <UnitIncidentSection
            unitId={unit.id}
            incidents={unit.incidents}
            interpersonalCount={interpersonalIncidents.length}
            maintenanceCount={maintenanceIncidents.length}
            frequentSubjects={frequentSubjects}
          />
        </div>

        {/* Right column: Unit details */}
        <UnitSidebar unit={unit} />
      </div>
    </div>
  )
}

// Helper components

function HarmonyBadge({ status }: { status: HarmonyStatus }) {
  const colorClasses: Record<HarmonyStatus, string> = {
    excellent: 'bg-green-100 text-green-800',
    good: 'bg-emerald-100 text-emerald-800',
    moderate: 'bg-yellow-100 text-yellow-800',
    concerning: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
  }

  return (
    <span className={`badge ${colorClasses[status]}`}>
      {HARMONY_STATUS_LABELS[status]}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const badgeClasses: Record<string, string> = {
    AVAILABLE: 'badge-active',
    FULL: 'badge-pending',
    MAINTENANCE: 'badge-alert',
    CLOSED: 'badge-ended',
  }

  return (
    <span className={`badge ${badgeClasses[status] || 'badge-ended'}`}>
      {HOUSING_STATUS_LABELS[status] || status}
    </span>
  )
}

interface ResidentCardPlacement {
  id: string
  residentId: string
  startDate: Date | string
  resident: { code: string }
}

function ResidentCard({
  placement,
  compatibilityScores,
  otherResidentIds,
}: {
  placement: ResidentCardPlacement
  compatibilityScores: CompatibilityAssessment[]
  otherResidentIds: string[]
}) {
  const avgScore = otherResidentIds.length > 0
    ? Math.round(
        compatibilityScores
          .filter(s =>
            (s.residentId === placement.residentId && otherResidentIds.includes(s.comparedWithId)) ||
            (s.comparedWithId === placement.residentId && otherResidentIds.includes(s.residentId))
          )
          .reduce((sum, s) => sum + s.overallScore, 0) / Math.max(1, otherResidentIds.length)
      )
    : null

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-aoz-primary text-white rounded-full flex items-center justify-center font-medium">
          {placement.resident.code.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <p className="font-medium text-gray-900">{placement.resident.code}</p>
          <p className="text-sm text-gray-500">
            Seit {formatDate(placement.startDate)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {avgScore !== null && (
          <div className="text-right">
            <p className="text-sm text-gray-500">Ø Kompatibilität</p>
            <p className={`font-medium ${getScoreColorClass(avgScore)}`}>
              {avgScore}% - {getScoreLabel(avgScore)}
            </p>
          </div>
        )}
        <Link
          href={`/residents/${placement.residentId}`}
          className="text-aoz-primary hover:underline text-sm"
        >
          Details
        </Link>
      </div>
    </div>
  )
}
