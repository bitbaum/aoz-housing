/**
 * Mission KPI Section — displays the 4 core mission metrics
 *
 * Shows: incidents/month trend, conflict relocations, placement time, conflict trend
 */

import type { MissionKPIs } from '@/lib/analytics/mission-kpis'
import { MISSION_KPI_LABELS } from '@/lib/constants/labels'

interface Props {
  kpis: MissionKPIs
}

const TREND_STYLES = {
  improving: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: '↓', label: MISSION_KPI_LABELS.trendImproving },
  stable: { bg: 'bg-blue-50', text: 'text-blue-700', icon: '→', label: MISSION_KPI_LABELS.trendStable },
  worsening: { bg: 'bg-red-50', text: 'text-red-700', icon: '↑', label: MISSION_KPI_LABELS.trendWorsening },
}

export function MissionKPISection({ kpis }: Props) {
  const trendStyle = TREND_STYLES[kpis.trend]

  return (
    <div className="card">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{MISSION_KPI_LABELS.sectionTitle}</h2>
          <p className="text-sm text-gray-500">
            {MISSION_KPI_LABELS.sectionDesc(kpis.monthsTracked)}
          </p>
        </div>
        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${trendStyle.bg} ${trendStyle.text}`}>
          <span aria-hidden="true">{trendStyle.icon}</span>
          {trendStyle.label}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard
          label={MISSION_KPI_LABELS.conflictsPerMonth}
          value={kpis.avgIncidentsPerMonth}
          current={kpis.currentMonthIncidents}
          currentLabel={MISSION_KPI_LABELS.currentLabel}
          target="-30%"
          unit=""
        />
        <KPICard
          label={MISSION_KPI_LABELS.relocationsPerMonth}
          value={kpis.avgRelocationsPerMonth}
          current={kpis.currentMonthRelocations}
          currentLabel={MISSION_KPI_LABELS.currentLabel}
          target="-50%"
          unit=""
        />
        <KPICard
          label={MISSION_KPI_LABELS.avgPlacementTime}
          value={kpis.avgPlacementTimeDays}
          current={kpis.recentPlacementTimeDays}
          currentLabel={MISSION_KPI_LABELS.last30Days}
          target={MISSION_KPI_LABELS.targetDays}
          unit={MISSION_KPI_LABELS.daysUnit}
        />
        <div className={`rounded-lg border p-4 ${trendStyle.bg}`}>
          <p className="text-sm text-gray-600 mb-1">{MISSION_KPI_LABELS.conflictTrend}</p>
          <p className={`text-2xl font-bold ${trendStyle.text}`}>{trendStyle.label}</p>
          <p className="text-xs text-gray-500 mt-2">{kpis.trendDetail}</p>
        </div>
      </div>

      {/* Monthly Sparklines */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MiniChart
          label={MISSION_KPI_LABELS.conflictsMonthlyChart}
          data={kpis.incidentsPerMonth}
          color="text-orange-500"
          barColor="bg-orange-400"
        />
        <MiniChart
          label={MISSION_KPI_LABELS.relocationsMonthlyChart}
          data={kpis.conflictRelocationsPerMonth}
          color="text-red-500"
          barColor="bg-red-400"
        />
      </div>
    </div>
  )
}

function KPICard({
  label,
  value,
  current,
  currentLabel,
  target,
  unit,
}: {
  label: string
  value: number | null
  current: number | null
  currentLabel: string
  target: string
  unit: string
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">
        {value !== null ? value : '—'}
        {value !== null && unit && <span className="text-sm font-normal text-gray-500 ml-1">{unit}</span>}
      </p>
      {current !== null && (
        <p className="text-xs text-gray-500 mt-1">
          {currentLabel}: <span className="font-medium text-gray-700">{current}{unit ? ` ${unit}` : ''}</span>
        </p>
      )}
      <p className="text-xs text-gray-400 mt-1">Ziel: {target}</p>
    </div>
  )
}

function MiniChart({
  label,
  data,
  color,
  barColor,
}: {
  label: string
  data: { label: string; value: number }[]
  color: string
  barColor: string
}) {
  const maxValue = Math.max(...data.map(d => d.value), 1)

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className={`text-sm font-medium ${color} mb-3`}>{label}</p>
      <div className="flex items-end gap-1 h-16">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className={`w-full rounded-t ${barColor} transition-all`}
              style={{ height: `${Math.max((d.value / maxValue) * 100, 4)}%` }}
              title={`${d.label}: ${d.value}`}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[11px] text-gray-400">{data[0]?.label}</span>
        <span className="text-[11px] text-gray-400">{data[data.length - 1]?.label}</span>
      </div>
    </div>
  )
}
