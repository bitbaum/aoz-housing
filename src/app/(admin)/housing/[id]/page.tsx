import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  INCIDENT_TYPE_LABELS,
  INCIDENT_CATEGORY_ICONS,
  HOUSING_STATUS_LABELS,
  HARMONY_STATUS_LABELS,
  AGE_RANGE_LABELS,
  LANGUAGE_LABELS,
  getLabel,
} from '@/lib/constants'
import {
  getScoreLabel,
  getScoreColorClass,
  getScoreBgClass,
  getSeverityBorderClass,
  getOccupancyColorClass,
  formatRelativeDate,
  formatDate,
  getDateDaysAgo,
  getHarmonyStatus,
  type HarmonyStatus,
} from '@/lib/utils'
import { getScoreLevel, SCORE_THRESHOLDS } from '@/lib/config/thresholds'
import { DetailRow } from '@/components/ui/Card'
import { RoomVisualizationWithPlacement } from '@/components/housing/RoomVisualizationWithPlacement'
import { CompatibilityMatrixInteractive } from '@/components/housing/CompatibilityMatrixInteractive'
import { ApartmentProfileCard } from '@/components/housing/ApartmentProfileCard'
import { ProblemDetectionCard } from '@/components/housing/ProblemDetectionCard'
import { calculateApartmentProfile, calculateApartmentFit } from '@/lib/compatibility/aggregate'
import { toResidentProfile } from '@/lib/compatibility/convert'

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
  const occupancyPercent = Math.round((occupancy / unit.totalBeds) * 100)

  // Calculate who fits in this unit (only if there's space)
  let compatibleResidents: { resident: any; fitScore: number; strengths: string[]; concerns: string[] }[] = []
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
        currentResidents.map(r => toResidentProfile(r as any))
      )
      apartmentProfile.unitId = unit.id

      // Calculate fit for each unplaced resident
      compatibleResidents = unplacedResidents
        .map(resident => {
          const residentProfile = toResidentProfile(resident as any)
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
            .filter((c: any) => c.severity === 'BLOCKING')
            .forEach((c: any) => concerns.push(c.message))

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
          <h1 className="text-2xl font-bold text-gray-900 mt-2">{unit.address}</h1>
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="card">
          <p className="text-sm text-gray-500">Belegung</p>
          <p className="text-2xl font-bold text-gray-900">
            {occupancy} / {unit.totalBeds}
          </p>
          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${getOccupancyColorClass(occupancyPercent)}`}
              style={{ width: `${occupancyPercent}%` }}
            />
          </div>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Zimmer</p>
          <p className="text-2xl font-bold text-gray-900">{unit.totalRooms}</p>
          <p className="text-sm text-gray-500 mt-1">
            {unit.privateRooms} privat, {unit.sharedRooms} geteilt
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Konflikte (30 Tage)</p>
          <p className="text-2xl font-bold text-gray-900">
            {interpersonalIncidents.filter(i =>
              new Date(i.date) > getDateDaysAgo(30)
            ).length}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {interpersonalIncidents.filter(i => !i.resolvedAt).length} offen
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Wartung</p>
          <p className="text-2xl font-bold text-gray-900">
            {maintenanceIncidents.filter(i => !i.resolvedAt).length}
          </p>
          <p className="text-sm text-gray-500 mt-1">offene Meldungen</p>
        </div>
      </div>

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
                spots={unit.spots as any}
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
              residents={unit.placements.map(p => p.resident) as any}
            />
          )}

          {/* Problem Detection Card */}
          {unit.placements.length > 1 && (
            <ProblemDetectionCard
              residents={unit.placements.map(p => p.resident) as any}
              compatibilityScores={compatibilityScores}
              housingUnitId={unit.id}
            />
          )}

          {/* Who Fits Here - Only show if there's available space */}
          {hasAvailableSpace && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Wer passt hierher?
                  </h2>
                  <p className="text-sm text-gray-500">
                    {unit.totalBeds - unit.placements.length} freie{' '}
                    {unit.totalBeds - unit.placements.length === 1 ? 'Platz' : 'Plätze'}
                  </p>
                </div>
                <Link
                  href={`/matching?unit=${unit.id}`}
                  className="btn-outline text-sm"
                >
                  Alle anzeigen
                </Link>
              </div>

              {compatibleResidents.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-500 mb-3">Keine passenden unplatzierten Bewohner</p>
                  <Link href="/residents/new" className="btn-primary text-sm">
                    Neuen Bewohner erfassen
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {compatibleResidents.map((match) => {
                    const scoreLevel = getScoreLevel(match.fitScore)
                    const isGoodFit = scoreLevel === 'excellent' || scoreLevel === 'good'
                    return (
                    <div
                      key={match.resident.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        match.concerns.length > 0
                          ? 'border-orange-200 bg-orange-50'
                          : isGoodFit
                          ? 'border-green-200 bg-green-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
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
                            {match.resident.languages?.slice(0, 2).map((l: string) => getLabel(LANGUAGE_LABELS, l)).join(', ')}
                          </p>
                          {match.strengths.length > 0 && match.concerns.length === 0 && (
                            <p className="text-xs text-green-600 mt-0.5">
                              ✓ {match.strengths[0]}
                            </p>
                          )}
                          {match.concerns.length > 0 && (
                            <p className="text-xs text-orange-600 mt-0.5">
                              {match.concerns[0]}
                            </p>
                          )}
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
                  )})}
                </div>
              )}
            </div>
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
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Vorfälle & Meldungen
              </h2>
              <Link href={`/incidents/new?unit=${unit.id}`} className="btn-outline text-sm">
                Neuer Vorfall
              </Link>
            </div>

            {/* Frequent Subjects Warning */}
            {frequentSubjects.length > 0 && (
              <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <span className="text-amber-600 text-lg">!</span>
                  <div>
                    <p className="text-sm font-medium text-amber-800">
                      Häufig betroffene Bewohner
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {frequentSubjects.map((s) => (
                        <Link
                          key={s.id}
                          href={`/residents/${s.id}`}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 rounded text-sm hover:bg-amber-200 transition-colors"
                        >
                          <span className="font-medium">{s.code}</span>
                          <span className="text-amber-600">({s.count}x)</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-4">
              <div className="flex gap-2 border-b border-gray-200">
                <TabButton active>Alle ({unit.incidents.length})</TabButton>
                <TabButton>Konflikte ({interpersonalIncidents.length})</TabButton>
                <TabButton>Wartung ({maintenanceIncidents.length})</TabButton>
              </div>
            </div>

            {unit.incidents.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Keine Vorfälle dokumentiert
              </p>
            ) : (
              <div className="space-y-3">
                {unit.incidents.map((incident) => (
                  <IncidentCard key={incident.id} incident={incident} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Unit details */}
        <div className="space-y-6">
          {/* Facilities */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Ausstattung
            </h2>
            <dl className="space-y-3 text-sm">
              <DetailRow
                label="Badezimmer"
                value={`${unit.privateBathrooms} privat, ${unit.sharedBathrooms} geteilt`}
              />
              <DetailRow
                label="Küche"
                value={unit.privateKitchen ? 'Privat' : unit.sharedKitchen ? 'Geteilt' : 'Keine'}
              />
              <DetailRow
                label="Barrierefreiheit"
                value={
                  unit.wheelchairAccess ? 'Rollstuhlgerecht' :
                  unit.groundFloor ? 'Erdgeschoss' :
                  unit.elevator ? 'Lift vorhanden' : 'Eingeschränkt'
                }
              />
            </dl>
          </div>

          {/* Rules */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Hausregeln
            </h2>
            <div className="space-y-2 text-sm">
              <RuleItem
                label="Rauchen"
                allowed={unit.smokingAllowed}
              />
              <RuleItem
                label="Haustiere"
                allowed={unit.petsAllowed}
              />
              {unit.quietHours && (
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="text-blue-500">🌙</span>
                  Ruhezeiten: {unit.quietHours}
                </div>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Lage
            </h2>
            <div className="space-y-2 text-sm">
              <LocationItem
                label="ÖV"
                available={unit.nearPublicTransport}
              />
              <LocationItem
                label="Gesundheit"
                available={unit.nearHealthServices}
              />
              <LocationItem
                label="Schulen"
                available={unit.nearSchools}
              />
            </div>
          </div>

          {/* Notes */}
          {unit.notes && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Notizen
              </h2>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                {unit.notes}
              </p>
            </div>
          )}
        </div>
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

function ResidentCard({
  placement,
  compatibilityScores,
  otherResidentIds,
}: {
  placement: any
  compatibilityScores: any[]
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

function IncidentCard({ incident }: { incident: any }) {
  const categoryIcon = INCIDENT_CATEGORY_ICONS[incident.category] || '💬'

  return (
    <div className={`p-4 bg-gray-50 rounded-lg border-l-4 ${getSeverityBorderClass(incident.severity)}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <span className="text-lg">{categoryIcon}</span>
          <div>
            <p className="font-medium text-gray-900">
              {getIncidentTypeLabel(incident.type)}
            </p>
            <p className="text-sm text-gray-600 mt-1">{incident.description}</p>
            {incident.resident && (
              <p className="text-sm text-gray-500 mt-1">
                Betrifft: {incident.resident.code}
              </p>
            )}
          </div>
        </div>
        <div className="text-right text-sm">
          <p className="text-gray-500">
            {formatRelativeDate(incident.date)}
          </p>
          {incident.resolvedAt ? (
            <span className="badge badge-active">Gelöst</span>
          ) : (
            <span className="badge badge-pending">Offen</span>
          )}
        </div>
      </div>
      {incident.resolution && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Lösung:</span> {incident.resolution}
          </p>
        </div>
      )}
    </div>
  )
}

function TabButton({ children, active = false }: { children: React.ReactNode; active?: boolean }) {
  return (
    <button
      className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
        active
          ? 'border-aoz-primary text-aoz-primary'
          : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      {children}
    </button>
  )
}

function RuleItem({ label, allowed }: { label: string; allowed: boolean }) {
  return (
    <div className="flex items-center gap-2 text-gray-600">
      <span className={allowed ? 'text-green-500' : 'text-red-500'}>
        {allowed ? '✓' : '✗'}
      </span>
      {label} {allowed ? 'erlaubt' : 'nicht erlaubt'}
    </div>
  )
}

function LocationItem({ label, available }: { label: string; available: boolean }) {
  return (
    <div className="flex items-center gap-2 text-gray-600">
      <span className={available ? 'text-green-500' : 'text-gray-400'}>
        {available ? '✓' : '○'}
      </span>
      {label} {available ? 'in der Nähe' : '-'}
    </div>
  )
}

// Utility functions - use imported shared utilities
// getScoreColorClass, getScoreBgClass, getSeverityBorderClass, formatRelativeDate, getHarmonyStatus imported from @/lib/utils

const getIncidentTypeLabel = (type: string) => INCIDENT_TYPE_LABELS[type] || type
