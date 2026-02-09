import { prisma } from '@/lib/db'
import Link from 'next/link'
import {
  INCIDENT_TYPE_LABELS,
  END_REASON_LABELS,
  SATISFACTION_EMOJIS,
  SUPPORT_LEVEL_LABELS,
  COMPATIBILITY_GAP_LABELS,
  getLabel,
} from '@/lib/constants'
import { getDateDaysAgo, formatDate } from '@/lib/utils'
import { PeriodSelector } from '@/components/ui/PeriodSelector'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ days?: string }>
}

export default async function AnalyticsPage({ searchParams }: Props) {
  const params = await searchParams
  const days = Math.min(Math.max(Number(params.days) || 30, 7), 365)
  const periodStart = getDateDaysAgo(days)
  const ninetyDaysAgo = getDateDaysAgo(90)

  const [
    residents,
    units,
    placements,
    recentPlacements,
    recentIncidents,
    checkIns,
  ] = await Promise.all([
    prisma.resident.findMany({
      where: { status: { in: ['ACTIVE', 'PLACED'] } },
    }),
    prisma.housingUnit.findMany({
      include: { placements: { where: { status: 'ACTIVE' } } },
    }),
    prisma.placement.findMany({
      where: { status: 'ACTIVE' },
      include: {
        resident: true,
        housingUnit: true,
        checkIns: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    }),
    prisma.placement.findMany({
      where: { startDate: { gte: ninetyDaysAgo } },
      include: {
        housingUnit: true,
        resident: true,
        checkIns: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { startDate: 'desc' },
    }),
    prisma.incident.findMany({
      where: {
        date: { gte: periodStart },
        category: 'INTERPERSONAL', // Only conflicts, not maintenance
      },
      include: { housingUnit: true },
    }),
    prisma.satisfactionCheckIn.findMany({
      where: { createdAt: { gte: periodStart } },
      include: {
        placement: {
          include: { resident: true, housingUnit: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  // Get all ended placements for end reason analysis (including conflict analysis fields)
  const endedPlacements = await prisma.placement.findMany({
    where: { status: { not: 'ACTIVE' } },
    select: {
      endReason: true,
      conflictGap: true,
      wasPredictable: true,
      compatibilityScore: true,
    },
  })

  // Calculate metrics
  const totalBeds = units.reduce((sum, u) => sum + u.totalBeds, 0)
  const occupiedBeds = units.reduce((sum, u) => sum + u.placements.length, 0)
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0

  // Check-in status - find overdue
  const now = new Date()
  const overdueCheckIns = placements.filter((p) => {
    const supportLevel = p.resident.supportLevel || 'STANDARD'
    const intervalDays = supportLevel === 'INTENSIVE' ? 7 : supportLevel === 'ELEVATED' ? 14 : 28
    const lastCheckIn = p.checkIns[0]
    const daysSinceCheckIn = lastCheckIn
      ? Math.ceil((now.getTime() - new Date(lastCheckIn.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      : Math.ceil((now.getTime() - new Date(p.startDate).getTime()) / (1000 * 60 * 60 * 24))
    return daysSinceCheckIn > intervalDays
  })

  // Satisfaction analysis from recent check-ins
  const satisfactionCounts = [0, 0, 0, 0, 0] // Index 0 = rating 1, etc.
  checkIns.forEach((c) => {
    if (c.overallSatisfaction >= 1 && c.overallSatisfaction <= 5) {
      satisfactionCounts[c.overallSatisfaction - 1]++
    }
  })
  const totalCheckIns = checkIns.length
  const lowSatisfactionCheckIns = checkIns.filter((c) => c.overallSatisfaction <= 2)
  const avgSatisfaction = totalCheckIns > 0
    ? (checkIns.reduce((sum, c) => sum + c.overallSatisfaction, 0) / totalCheckIns).toFixed(1)
    : null

  // Conflict analysis
  const conflictEnds = endedPlacements.filter((p) => p.endReason === 'CONFLICT').length
  const conflictRate = endedPlacements.length > 0
    ? Math.round((conflictEnds / endedPlacements.length) * 100)
    : 0

  const unresolvedIncidents = recentIncidents.filter((i) => !i.resolvedAt)

  // Incident type breakdown (conflicts only)
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

  // Conflict gap analysis (only placements that ended due to CONFLICT with gap data)
  const conflictPlacements = endedPlacements.filter(
    (p) => p.endReason === 'CONFLICT' && p.conflictGap
  )
  const conflictsByGap = conflictPlacements.reduce((acc, p) => {
    if (p.conflictGap) {
      acc[p.conflictGap] = (acc[p.conflictGap] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)

  // Predictability analysis
  const predictableConflicts = conflictPlacements.filter((p) => p.wasPredictable === true)
  const unpredictableConflicts = conflictPlacements.filter((p) => p.wasPredictable === false)
  const lowScoreConflicts = conflictPlacements.filter(
    (p) => p.compatibilityScore !== null && p.compatibilityScore < 60
  )

  // Units with most conflicts (30 days)
  const incidentsByUnit = recentIncidents.reduce((acc, i) => {
    acc[i.housingUnitId] = acc[i.housingUnitId] || { count: 0, unit: i.housingUnit }
    acc[i.housingUnitId].count++
    return acc
  }, {} as Record<string, { count: number; unit: any }>)

  const hotspotUnits = Object.values(incidentsByUnit)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Auswertung</h1>
          <p className="text-gray-500">
            Übersicht über Belegung, Check-ins und Konflikte
          </p>
        </div>
        <PeriodSelector currentDays={days} />
      </div>

      {/* Key Metrics - All based on REAL DATA */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="Belegungsrate"
          value={`${occupancyRate}%`}
          subtitle={`${occupiedBeds} von ${totalBeds} Betten`}
        />
        <MetricCard
          label="Überfällige Check-ins"
          value={overdueCheckIns.length}
          subtitle={`von ${placements.length} aktiven`}
          href="/placements?status=active"
          highlight={overdueCheckIns.length > 0}
        />
        <MetricCard
          label="Konflikte ({days} Tage)"
          value={recentIncidents.length}
          subtitle={`${unresolvedIncidents.length} ungelöst`}
          href="/incidents?category=INTERPERSONAL"
          highlight={unresolvedIncidents.length > 0}
        />
        <MetricCard
          label="Konfliktbedingt beendet"
          value={`${conflictRate}%`}
          subtitle={`${conflictEnds} von ${endedPlacements.length} Beendungen`}
          highlight={conflictRate > 20}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Check-in Satisfaction (30 days) */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Zufriedenheit ({days} Tage)
            </h2>
            <Link href="/placements" className="text-sm text-aoz-primary hover:underline">
              Alle Check-ins
            </Link>
          </div>
          {totalCheckIns === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Keine Check-ins in diesem Zeitraum
            </p>
          ) : (
            <>
              <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="text-4xl">
                  {avgSatisfaction && parseFloat(avgSatisfaction) >= 4 ? '🙂' :
                   avgSatisfaction && parseFloat(avgSatisfaction) >= 3 ? '😐' : '😕'}
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{avgSatisfaction}/5</p>
                  <p className="text-sm text-gray-500">Ø aus {totalCheckIns} Check-ins</p>
                </div>
                {lowSatisfactionCheckIns.length > 0 && (
                  <div className="ml-auto text-right">
                    <p className="text-orange-600 font-semibold">{lowSatisfactionCheckIns.length}</p>
                    <p className="text-sm text-gray-500">mit Bedenken</p>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                {satisfactionCounts.map((count, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <span className="w-8 text-lg text-center">{SATISFACTION_EMOJIS[index]}</span>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            index >= 3 ? 'bg-green-500' :
                            index === 2 ? 'bg-yellow-500' : 'bg-orange-500'
                          }`}
                          style={{ width: `${totalCheckIns > 0 ? (count / totalCheckIns) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                    <span className="w-12 text-sm text-gray-500 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Conflict Hotspots */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Konflikt-Hotspots ({days} Tage)
          </h2>
          {hotspotUnits.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-3xl mb-2 block">✓</span>
              <p className="text-gray-500">Keine Konflikt-Hotspots</p>
            </div>
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
                    <p className="text-xs text-gray-500">Konflikte</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Conflict Types */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Konfliktarten ({days} Tage)
          </h2>
          {topIncidentTypes.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Keine Konflikte in diesem Zeitraum
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

        {/* Placement End Reasons */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Beendigungsgründe (gesamt)
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
                          {count} ({Math.round((count / endedPlacements.length) * 100)}%)
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
      </div>

      {/* Conflict Analysis Section */}
      {conflictEnds > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Conflict Gap Breakdown */}
          <div className="card border-l-4 border-orange-400">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-orange-500 text-xl">📊</span>
              <h2 className="text-lg font-semibold text-gray-900">
                Konfliktursachen
              </h2>
            </div>
            {Object.keys(conflictsByGap).length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-500 text-sm">
                  Noch keine detaillierten Konfliktdaten erfasst.
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Bei zukünftigen Konfliktbeendigungen werden Ursachen dokumentiert.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(conflictsByGap)
                  .sort((a, b) => b[1] - a[1])
                  .map(([gap, count]) => (
                    <div key={gap} className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-gray-900">
                            {getLabel(COMPATIBILITY_GAP_LABELS, gap)}
                          </span>
                          <span className="text-gray-500">
                            {count} ({Math.round((count / conflictPlacements.length) * 100)}%)
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-orange-500"
                            style={{
                              width: `${(count / conflictPlacements.length) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Predictability Insights */}
          <div className="card border-l-4 border-blue-400">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-blue-500 text-xl">🔮</span>
              <h2 className="text-lg font-semibold text-gray-900">
                Algorithmus-Einsichten
              </h2>
            </div>
            {conflictPlacements.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-500 text-sm">
                  Noch keine Vorhersagbarkeits-Daten erfasst.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-green-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {predictableConflicts.length}
                    </p>
                    <p className="text-xs text-green-700">Vorhersehbar</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-red-600">
                      {unpredictableConflicts.length}
                    </p>
                    <p className="text-xs text-red-700">Nicht vorhersehbar</p>
                  </div>
                </div>

                {(predictableConflicts.length + unpredictableConflicts.length) > 0 && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <strong>
                        {Math.round(
                          (predictableConflicts.length /
                            (predictableConflicts.length + unpredictableConflicts.length)) *
                            100
                        )}%
                      </strong>{' '}
                      der Konflikte waren laut Fallarbeitern vorhersehbar.
                    </p>
                  </div>
                )}

                {lowScoreConflicts.length > 0 && (
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-sm text-amber-800">
                      <strong>{lowScoreConflicts.length}</strong> Konflikte hatten einen
                      Kompatibilitäts-Score unter 60% bei Platzierung.
                    </p>
                    <p className="text-xs text-amber-600 mt-1">
                      → Erwägen Sie höhere Schwellenwerte für Platzierungen
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Placements with Check-in Status */}
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
                    Letzter Check-in
                  </th>
                  <th className="text-left py-3 px-2 font-medium text-gray-500">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentPlacements.slice(0, 10).map((placement) => {
                  const lastCheckIn = placement.checkIns[0]
                  const supportLevel = placement.resident.supportLevel || 'STANDARD'
                  const intervalDays = supportLevel === 'INTENSIVE' ? 7 : supportLevel === 'ELEVATED' ? 14 : 28
                  const daysSinceCheckIn = lastCheckIn
                    ? Math.ceil((now.getTime() - new Date(lastCheckIn.createdAt).getTime()) / (1000 * 60 * 60 * 24))
                    : null
                  const daysSinceStart = Math.ceil((now.getTime() - new Date(placement.startDate).getTime()) / (1000 * 60 * 60 * 24))
                  const isOverdue = placement.status === 'ACTIVE' &&
                    (daysSinceCheckIn === null ? daysSinceStart > intervalDays : daysSinceCheckIn > intervalDays)

                  return (
                    <tr
                      key={placement.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-2 text-gray-500">
                        {formatDate(placement.startDate)}
                      </td>
                      <td className="py-3 px-2">
                        <Link
                          href={`/residents/${placement.residentId}`}
                          className="text-aoz-primary hover:underline"
                        >
                          {placement.resident.code}
                        </Link>
                        {supportLevel !== 'STANDARD' && (
                          <span className="ml-2 text-xs text-orange-600">
                            {getLabel(SUPPORT_LEVEL_LABELS, supportLevel)}
                          </span>
                        )}
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
                        {lastCheckIn ? (
                          <div className="flex items-center gap-2">
                            <span>{SATISFACTION_EMOJIS[lastCheckIn.overallSatisfaction - 1]}</span>
                            <span className={`text-sm ${isOverdue ? 'text-orange-600' : 'text-gray-500'}`}>
                              vor {daysSinceCheckIn}d
                            </span>
                          </div>
                        ) : (
                          <span className={`text-sm ${isOverdue ? 'text-orange-600 font-medium' : 'text-gray-400'}`}>
                            {isOverdue ? 'Überfällig' : 'Ausstehend'}
                          </span>
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
                  )
                })}
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
  href,
  highlight = false,
}: {
  label: string
  value: string | number
  subtitle?: string
  href?: string
  highlight?: boolean
}) {
  const content = (
    <div className={`card ${href ? 'hover:shadow-md transition-shadow cursor-pointer' : ''}`}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${highlight ? 'text-orange-600' : 'text-gray-900'}`}>
        {value}
      </p>
      {subtitle && (
        <p className={`text-sm mt-2 ${highlight ? 'text-orange-500' : 'text-gray-500'}`}>
          {subtitle}
        </p>
      )}
    </div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}
