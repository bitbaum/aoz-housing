import { prisma } from '@/lib/db'
import Link from 'next/link'
import {
  INCIDENT_TYPE_LABELS,
  END_REASON_LABELS,
  getLabel,
} from '@/lib/constants'
import { getScoreBgClass, getScoreColorClass } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function AnalyticsPage() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)

  const [
    residents,
    units,
    placements,
    recentPlacements,
    incidents,
    recentIncidents,
    assessments,
  ] = await Promise.all([
    prisma.resident.findMany(),
    prisma.housingUnit.findMany({
      include: { placements: { where: { status: 'ACTIVE' } } },
    }),
    prisma.placement.findMany({
      include: { housingUnit: true },
    }),
    prisma.placement.findMany({
      where: { startDate: { gte: ninetyDaysAgo } },
      include: { housingUnit: true, resident: true },
      orderBy: { startDate: 'desc' },
    }),
    prisma.incident.findMany(),
    prisma.incident.findMany({
      where: { date: { gte: thirtyDaysAgo } },
      include: { housingUnit: true },
    }),
    prisma.compatibilityAssessment.findMany(),
  ])

  // Calculate metrics
  const activePlacements = placements.filter((p) => p.status === 'ACTIVE')
  const endedPlacements = placements.filter((p) => p.status !== 'ACTIVE')

  const totalBeds = units.reduce((sum, u) => sum + u.totalBeds, 0)
  const occupiedBeds = units.reduce((sum, u) => sum + u.placements.length, 0)
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0

  const avgCompatibility =
    activePlacements.filter((p) => p.compatibilityScore).length > 0
      ? Math.round(
          activePlacements
            .filter((p) => p.compatibilityScore)
            .reduce((sum, p) => sum + (p.compatibilityScore || 0), 0) /
            activePlacements.filter((p) => p.compatibilityScore).length
        )
      : null

  const conflictEnds = endedPlacements.filter(
    (p) => p.endReason === 'CONFLICT'
  ).length
  const conflictRate =
    endedPlacements.length > 0
      ? Math.round((conflictEnds / endedPlacements.length) * 100)
      : 0

  const interpersonalIncidents = recentIncidents.filter(
    (i) => i.category === 'INTERPERSONAL'
  )
  const unresolvedIncidents = recentIncidents.filter((i) => !i.resolvedAt)

  // Incident type breakdown
  const incidentsByType = recentIncidents.reduce((acc, i) => {
    acc[i.type] = (acc[i.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const topIncidentTypes = Object.entries(incidentsByType)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  // End reason breakdown
  const endsByReason = endedPlacements.reduce((acc, p) => {
    if (p.endReason) {
      acc[p.endReason] = (acc[p.endReason] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)

  // Units with most incidents
  const incidentsByUnit = recentIncidents.reduce((acc, i) => {
    acc[i.housingUnitId] = acc[i.housingUnitId] || { count: 0, unit: i.housingUnit }
    acc[i.housingUnitId].count++
    return acc
  }, {} as Record<string, { count: number; unit: any }>)

  const hotspotUnits = Object.values(incidentsByUnit)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // Score distribution
  const scoreRanges = {
    excellent: assessments.filter((a) => a.overallScore >= 80).length,
    good: assessments.filter((a) => a.overallScore >= 60 && a.overallScore < 80)
      .length,
    moderate: assessments.filter(
      (a) => a.overallScore >= 40 && a.overallScore < 60
    ).length,
    low: assessments.filter((a) => a.overallScore >= 20 && a.overallScore < 40)
      .length,
    critical: assessments.filter((a) => a.overallScore < 20).length,
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Auswertung</h1>
        <p className="text-gray-500">
          Übersicht über Platzierungen, Vorfälle und Algorithmus-Performance
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="Belegungsrate"
          value={`${occupancyRate}%`}
          subtitle={`${occupiedBeds} / ${totalBeds} Betten`}
        />
        <MetricCard
          label="Ø Kompatibilität"
          value={avgCompatibility ? `${avgCompatibility}%` : '-'}
          subtitle="Aktive Platzierungen"
          trend={avgCompatibility && avgCompatibility >= 70 ? 'good' : 'warning'}
        />
        <MetricCard
          label="Vorfälle (30 Tage)"
          value={recentIncidents.length}
          subtitle={`${unresolvedIncidents.length} offen`}
          trend={recentIncidents.length > 10 ? 'warning' : 'good'}
        />
        <MetricCard
          label="Konfliktbedingte Beendigung"
          value={`${conflictRate}%`}
          subtitle={`${conflictEnds} von ${endedPlacements.length}`}
          trend={conflictRate > 20 ? 'warning' : 'good'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incident Analysis */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Vorfallanalyse (30 Tage)
          </h2>
          {topIncidentTypes.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Keine Vorfälle in diesem Zeitraum
            </p>
          ) : (
            <div className="space-y-3">
              {topIncidentTypes.map(([type, count]) => (
                <div key={type} className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-900">
                        {getLabel(INCIDENT_TYPE_LABELS, type)}
                      </span>
                      <span className="text-gray-500">{count}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-aoz-primary"
                        style={{
                          width: `${(count / recentIncidents.length) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Hotspot Units */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Hotspots (30 Tage)
          </h2>
          {hotspotUnits.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Keine Hotspots</p>
          ) : (
            <div className="space-y-3">
              {hotspotUnits.map(({ unit, count }) => (
                <Link
                  key={unit.id}
                  href={`/housing/${unit.id}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900">{unit.code}</p>
                    <p className="text-sm text-gray-500">{unit.address}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-orange-600">{count}</p>
                    <p className="text-xs text-gray-500">Vorfälle</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Placement End Reasons */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Beendigungsgründe
          </h2>
          {endedPlacements.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Keine beendeten Platzierungen
            </p>
          ) : (
            <div className="space-y-3">
              {Object.entries(endsByReason)
                .sort((a, b) => b[1] - a[1])
                .map(([reason, count]) => (
                  <div key={reason} className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-900">
                          {getLabel(END_REASON_LABELS, reason)}
                        </span>
                        <span className="text-gray-500">
                          {count} (
                          {Math.round((count / endedPlacements.length) * 100)}%)
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            reason === 'CONFLICT'
                              ? 'bg-red-500'
                              : reason === 'NATURAL'
                              ? 'bg-green-500'
                              : 'bg-yellow-500'
                          }`}
                          style={{
                            width: `${(count / endedPlacements.length) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Algorithm Performance */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Algorithmus-Performance
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Verteilung der Kompatibilitätsbewertungen
          </p>
          {assessments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Keine Bewertungen vorhanden
            </p>
          ) : (
            <div className="space-y-3">
              <ScoreBar
                label="Sehr gut (80-100)"
                count={scoreRanges.excellent}
                total={assessments.length}
                color="bg-green-500"
              />
              <ScoreBar
                label="Gut (60-79)"
                count={scoreRanges.good}
                total={assessments.length}
                color="bg-emerald-500"
              />
              <ScoreBar
                label="Mittel (40-59)"
                count={scoreRanges.moderate}
                total={assessments.length}
                color="bg-yellow-500"
              />
              <ScoreBar
                label="Niedrig (20-39)"
                count={scoreRanges.low}
                total={assessments.length}
                color="bg-orange-500"
              />
              <ScoreBar
                label="Kritisch (0-19)"
                count={scoreRanges.critical}
                total={assessments.length}
                color="bg-red-500"
              />
            </div>
          )}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Total: {assessments.length} Bewertungen
            </p>
          </div>
        </div>
      </div>

      {/* Recent Placements */}
      <div className="card mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Neueste Platzierungen (90 Tage)
        </h2>
        {recentPlacements.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Keine neuen Platzierungen
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 font-medium text-gray-500">
                    Datum
                  </th>
                  <th className="text-left py-3 px-2 font-medium text-gray-500">
                    Bewohner
                  </th>
                  <th className="text-left py-3 px-2 font-medium text-gray-500">
                    Unterkunft
                  </th>
                  <th className="text-left py-3 px-2 font-medium text-gray-500">
                    Kompatibilität
                  </th>
                  <th className="text-left py-3 px-2 font-medium text-gray-500">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentPlacements.slice(0, 10).map((placement) => (
                  <tr
                    key={placement.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-2 text-gray-500">
                      {new Date(placement.startDate).toLocaleDateString('de-CH')}
                    </td>
                    <td className="py-3 px-2">
                      <Link
                        href={`/residents/${placement.residentId}`}
                        className="text-aoz-primary hover:underline"
                      >
                        {placement.resident.code}
                      </Link>
                    </td>
                    <td className="py-3 px-2">
                      <Link
                        href={`/housing/${placement.housingUnitId}`}
                        className="text-aoz-primary hover:underline"
                      >
                        {placement.housingUnit.code}
                      </Link>
                    </td>
                    <td className="py-3 px-2">
                      {placement.compatibilityScore ? (
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${getScoreBgClass(
                            placement.compatibilityScore
                          )}`}
                        >
                          {Math.round(placement.compatibilityScore)}%
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-2">
                      <span
                        className={`badge ${
                          placement.status === 'ACTIVE'
                            ? 'badge-active'
                            : 'badge-ended'
                        }`}
                      >
                        {placement.status === 'ACTIVE' ? 'Aktiv' : 'Beendet'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function MetricCard({
  label,
  value,
  subtitle,
  trend,
}: {
  label: string
  value: string | number
  subtitle?: string
  trend?: 'good' | 'warning' | 'neutral'
}) {
  const trendColor =
    trend === 'good'
      ? 'text-green-600'
      : trend === 'warning'
      ? 'text-orange-600'
      : 'text-gray-500'

  return (
    <div className="card">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
      {subtitle && <p className={`text-sm mt-2 ${trendColor}`}>{subtitle}</p>}
    </div>
  )
}

function ScoreBar({
  label,
  count,
  total,
  color,
}: {
  label: string
  count: number
  total: number
  color: string
}) {
  const percent = total > 0 ? Math.round((count / total) * 100) : 0

  return (
    <div className="flex items-center gap-4">
      <div className="w-32 text-sm text-gray-600">{label}</div>
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
          <div className={`h-full ${color}`} style={{ width: `${percent}%` }} />
        </div>
      </div>
      <div className="w-16 text-right text-sm text-gray-500">
        {count} ({percent}%)
      </div>
    </div>
  )
}
