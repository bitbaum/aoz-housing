import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  INCIDENT_TYPE_LABELS,
  HOUSING_STATUS_LABELS,
  HARMONY_STATUS_LABELS,
} from '@/lib/constants'
import {
  getScoreLabel,
  getScoreColorClass,
  getScoreBgClass,
  getSeverityBorderClass,
  getOccupancyColorClass,
  formatRelativeDate,
  type HarmonyStatus,
} from '@/lib/utils'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function HousingDetailPage({ params }: Props) {
  const { id } = await params

  const unit = await prisma.housingUnit.findUnique({
    where: { id },
    include: {
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
          resident: true,
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

  // Calculate harmony status
  const harmonyStatus = calculateHarmonyStatus(unit, compatibilityScores)

  // Split incidents by category
  const interpersonalIncidents = unit.incidents.filter(
    i => i.category === 'INTERPERSONAL' || i.category === 'SAFETY'
  )
  const maintenanceIncidents = unit.incidents.filter(
    i => i.category === 'MAINTENANCE'
  )

  const occupancy = unit.placements.length
  const occupancyPercent = Math.round((occupancy / unit.totalBeds) * 100)

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
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
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
              new Date(i.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
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
          {/* Current Residents */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Aktuelle Bewohner
              </h2>
              <Link href={`/matching?unit=${unit.id}`} className="btn-outline text-sm">
                Neuen Bewohner platzieren
              </Link>
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

          {/* Compatibility Matrix */}
          {unit.placements.length > 1 && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Kompatibilitätsmatrix
              </h2>
              <CompatibilityMatrix
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
            Seit {new Date(placement.startDate).toLocaleDateString('de-CH')}
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

function CompatibilityMatrix({ residents, scores }: { residents: any[]; scores: any[] }) {
  const getScore = (r1: string, r2: string) => {
    if (r1 === r2) return null
    const assessment = scores.find(
      s => (s.residentId === r1 && s.comparedWithId === r2) ||
           (s.residentId === r2 && s.comparedWithId === r1)
    )
    return assessment?.overallScore ?? null
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr>
            <th className="p-2"></th>
            {residents.map(r => (
              <th key={r.id} className="p-2 text-center font-medium text-gray-700">
                {r.code}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {residents.map(r1 => (
            <tr key={r1.id}>
              <td className="p-2 font-medium text-gray-700">{r1.code}</td>
              {residents.map(r2 => {
                const score = getScore(r1.id, r2.id)
                return (
                  <td key={r2.id} className="p-2 text-center">
                    {score === null ? (
                      <span className="text-gray-300">-</span>
                    ) : (
                      <span className={`inline-flex items-center justify-center w-12 h-8 rounded ${getScoreBgClass(score)} text-xs font-medium`}>
                        {score}
                      </span>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function IncidentCard({ incident }: { incident: any }) {
  const categoryIcon = incident.category === 'MAINTENANCE' ? '🔧' :
                       incident.category === 'SAFETY' ? '⚠️' : '💬'

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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-gray-900 font-medium">{value}</dd>
    </div>
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
// getScoreColorClass, getScoreBgClass, getSeverityBorderClass, formatRelativeDate imported from @/lib/utils

function calculateHarmonyStatus(unit: any, scores: any[]): HarmonyStatus {
  if (unit.placements.length <= 1) return 'excellent'

  const avgCompatibility = scores.length > 0
    ? scores.reduce((sum, s) => sum + s.overallScore, 0) / scores.length
    : 70

  const recentIncidents = unit.incidents.filter((i: any) =>
    i.category === 'INTERPERSONAL' &&
    new Date(i.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  ).length

  let harmonyScore = avgCompatibility - recentIncidents * 10

  if (harmonyScore >= 80) return 'excellent'
  if (harmonyScore >= 60) return 'good'
  if (harmonyScore >= 40) return 'moderate'
  if (harmonyScore >= 20) return 'concerning'
  return 'critical'
}

const getIncidentTypeLabel = (type: string) => INCIDENT_TYPE_LABELS[type] || type
