import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Statistiken' }
import {
  INCIDENT_TYPE_LABELS,
  END_REASON_LABELS,
  DASHBOARD_LABELS,
  getLabel,
} from '@/lib/constants'
import { getDateDaysAgo } from '@/lib/utils'
import { getCheckInInterval } from '@/lib/config/checkin-intervals'
import { DISPLAY_LIMITS } from '@/lib/config/thresholds'
import { PeriodSelector } from '@/components/ui/PeriodSelector'
import { SatisfactionChart } from '@/components/analytics/SatisfactionChart'
import { ConflictAnalysisSection } from '@/components/analytics/ConflictAnalysisSection'
import { RecentPlacementsTable } from '@/components/analytics/RecentPlacementsTable'
import { MissionKPISection } from '@/components/analytics/MissionKPISection'
import { AlgorithmAccuracySection } from '@/components/analytics/AlgorithmAccuracySection'
import { calculateMissionKPIs } from '@/lib/analytics/mission-kpis'
import { calculateAlgorithmAccuracy } from '@/lib/analytics/algorithm-accuracy'

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
  const [endedPlacements, missionKPIs, algorithmAccuracy] = await Promise.all([
    prisma.placement.findMany({
      where: { status: { not: 'ACTIVE' } },
      select: {
        endReason: true,
        conflictGap: true,
        wasPredictable: true,
        compatibilityScore: true,
      },
    }),
    calculateMissionKPIs(6),
    calculateAlgorithmAccuracy(),
  ])

  // Calculate metrics
  const totalBeds = units.reduce((sum, u) => sum + u.totalBeds, 0)
  const occupiedBeds = units.reduce((sum, u) => sum + u.placements.length, 0)
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0

  // Check-in status - find overdue
  const now = new Date()
  const overdueCheckIns = placements.filter((p) => {
    const supportLevel = p.resident.supportLevel || 'STANDARD'
    const intervalDays = getCheckInInterval(supportLevel)
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
    .slice(0, DISPLAY_LIMITS.topIncidentTypes)

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
  }, {} as Record<string, { count: number; unit: { id: string; code: string; address: string } }>)

  const hotspotUnits = Object.values(incidentsByUnit)
    .sort((a, b) => b.count - a.count)
    .slice(0, DISPLAY_LIMITS.problemUnits)

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Auswertung</h1>
          <p className="text-gray-500">
            Übersicht über Belegung, Check-ins und Konflikte
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/api/export/satisfaction"
            className="min-h-[44px] rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 inline-flex items-center"
          >
            Exportieren
          </a>
          <PeriodSelector currentDays={days} />
        </div>
      </div>

      {/* Mission KPIs */}
      <div className="mb-6 sm:mb-8">
        <MissionKPISection kpis={missionKPIs} />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <MetricCard
          label={DASHBOARD_LABELS.analyticsOccupancyRate}
          value={`${occupancyRate}%`}
          subtitle={`${occupiedBeds} von ${totalBeds} Betten`}
        />
        <MetricCard
          label={DASHBOARD_LABELS.analyticsOverdueCheckIns}
          value={overdueCheckIns.length}
          subtitle={`von ${placements.length} aktiven`}
          href="/placements?status=active"
          highlight={overdueCheckIns.length > 0}
        />
        <MetricCard
          label={`Konflikte (${days} Tage)`}
          value={recentIncidents.length}
          subtitle={`${unresolvedIncidents.length} ungelöst`}
          href="/incidents?category=INTERPERSONAL"
          highlight={unresolvedIncidents.length > 0}
        />
        <MetricCard
          label={DASHBOARD_LABELS.analyticsConflictEnded}
          value={`${conflictRate}%`}
          subtitle={`${conflictEnds} von ${endedPlacements.length} Beendungen`}
          highlight={conflictRate > 20}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Satisfaction Chart */}
        <SatisfactionChart
          days={days}
          totalCheckIns={totalCheckIns}
          avgSatisfaction={avgSatisfaction}
          satisfactionCounts={satisfactionCounts}
          lowSatisfactionCount={lowSatisfactionCheckIns.length}
        />

        {/* Conflict Hotspots */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Konflikt-Hotspots ({days} Tage)
          </h2>
          {hotspotUnits.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-3xl mb-2 block" aria-hidden="true">✓</span>
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
        <ConflictAnalysisSection
          conflictsByGap={conflictsByGap}
          conflictPlacementsCount={conflictPlacements.length}
          predictableCount={predictableConflicts.length}
          unpredictableCount={unpredictableConflicts.length}
          lowScoreCount={lowScoreConflicts.length}
        />
      )}

      {/* Algorithm Accuracy */}
      <div className="mt-6 sm:mt-8">
        <AlgorithmAccuracySection report={algorithmAccuracy} />
      </div>

      {/* Recent Placements */}
      <RecentPlacementsTable placements={recentPlacements} />
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
