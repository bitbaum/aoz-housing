/**
 * Mission KPI Section — displays the 4 core mission metrics
 *
 * Shows: incidents/month trend, conflict relocations, placement time, conflict trend
 */

import type { MissionKPIs } from '@/lib/analytics/mission-kpis'

interface Props {
  kpis: MissionKPIs
}

const TREND_STYLES = {
  improving: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: '↓', label: 'Verbesserung' },
  stable: { bg: 'bg-blue-50', text: 'text-blue-700', icon: '→', label: 'Stabil' },
  worsening: { bg: 'bg-red-50', text: 'text-red-700', icon: '↑', label: 'Verschlechterung' },
} as const

export function MissionKPISection({ kpis }: Props) {
  const trendStyle = TREND_STYLES[kpis.trend]

  return (
    <div className="card">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Missions-KPIs</h2>
          <p className="text-sm text-gray-500">
            Letzte {kpis.monthsTracked} Monate — Ziel: weniger Konflikte, schnellere Platzierung
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
          label="Konflikte / Monat"
          value={kpis.avgIncidentsPerMonth}
          current={kpis.currentMonthIncidents}
          currentLabel="Dieser Monat"
          target="-30%"
          unit=""
        />
        <KPICard
          label="Umsiedlungen / Monat"
          value={kpis.avgRelocationsPerMonth}
          current={kpis.currentMonthRelocations}
          currentLabel="Dieser Monat"
          target="-50%"
          unit=""
        />
        <KPICard
          label="Ø Platzierungszeit"
          value={kpis.avgPlacementTimeDays}
          current={kpis.recentPlacementTimeDays}
          currentLabel="Letzte 30 Tage"
          target="≤ 2 Tage"
          unit="Tage"
        />
        <div className={`rounded-lg border p-4 ${trendStyle.bg}`}>
          <p className="text-sm text-gray-600 mb-1">Konflikt-Trend</p>
          <p className={`text-2xl font-bold ${trendStyle.text}`}>{trendStyle.label}</p>
          <p className="text-xs text-gray-500 mt-2">{kpis.trendDetail}</p>
        </div>
      </div>

      {/* Monthly Sparklines */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MiniChart
          label="Konflikte pro Monat"
          data={kpis.incidentsPerMonth}
          color="text-orange-500"
          barColor="bg-orange-400"
        />
        <MiniChart
          label="Konflikt-Umsiedlungen pro Monat"
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
