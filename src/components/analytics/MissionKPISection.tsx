/**
 * Mission KPI Section — displays the 4 core mission metrics
 *
 * Shows: incidents/month trend, conflict relocations, placement time, conflict trend.
 * When a pilot baseline is configured, shows progress bars vs. baseline targets.
 */

import type { MissionKPIs } from '@/lib/analytics/mission-kpis'
import type { SystemConfigData } from '@/lib/actions/config'
import { MISSION_KPI_LABELS, PILOT_BASELINE_LABELS } from '@/lib/constants/labels'
import Link from 'next/link'

interface Props {
  kpis: MissionKPIs
  baseline?: SystemConfigData
}

const TREND_STYLES = {
  improving: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: '↓', label: MISSION_KPI_LABELS.trendImproving },
  stable: { bg: 'bg-blue-50', text: 'text-blue-700', icon: '→', label: MISSION_KPI_LABELS.trendStable },
  worsening: { bg: 'bg-red-50', text: 'text-red-700', icon: '↑', label: MISSION_KPI_LABELS.trendWorsening },
}

function pctChange(current: number, baseline: number): number {
  if (baseline === 0) return 0
  return Math.round(((baseline - current) / baseline) * 100)
}

export function MissionKPISection({ kpis, baseline }: Props) {
  const trendStyle = TREND_STYLES[kpis.trend]

  const hasBaseline =
    baseline &&
    (baseline.pilotBaselineIncidentsPerMonth !== null ||
      baseline.pilotBaselineRelocationsPerMonth !== null)

  return (
    <div className="card">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{MISSION_KPI_LABELS.sectionTitle}</h2>
          <p className="text-sm text-gray-500">
            {MISSION_KPI_LABELS.sectionDesc(kpis.monthsTracked)}
            {hasBaseline && baseline?.pilotStartDate && (
              <span className="ml-2 text-emerald-600 font-medium">
                · Pilot seit {new Date(baseline.pilotStartDate).toLocaleDateString('de-CH', { month: 'short', year: 'numeric' })}
              </span>
            )}
          </p>
        </div>
        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${trendStyle.bg} ${trendStyle.text}`}>
          <span aria-hidden="true">{trendStyle.icon}</span>
          {trendStyle.label}
        </div>
      </div>

      {/* No-baseline nudge */}
      {!hasBaseline && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2 text-sm text-amber-700">
          <span aria-hidden="true">ℹ</span>
          <span>
            {PILOT_BASELINE_LABELS.noBaselineHint}{' '}
            <Link href="/settings" className="underline font-medium hover:text-amber-900">
              Einstellungen
            </Link>
          </span>
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <KPICard
          label={MISSION_KPI_LABELS.conflictsPerMonth}
          value={kpis.avgIncidentsPerMonth}
          current={kpis.currentMonthIncidents}
          currentLabel={MISSION_KPI_LABELS.currentLabel}
          targetPct={30}
          unit=""
          baselineValue={baseline?.pilotBaselineIncidentsPerMonth ?? null}
        />
        <KPICard
          label={MISSION_KPI_LABELS.relocationsPerMonth}
          value={kpis.avgRelocationsPerMonth}
          current={kpis.currentMonthRelocations}
          currentLabel={MISSION_KPI_LABELS.currentLabel}
          targetPct={50}
          unit=""
          baselineValue={baseline?.pilotBaselineRelocationsPerMonth ?? null}
        />
        <KPICard
          label={MISSION_KPI_LABELS.mediationHoursPerWeek}
          value={kpis.avgMediationHoursPerWeek}
          current={null}
          currentLabel=""
          targetPct={40}
          unit={MISSION_KPI_LABELS.hoursUnit}
          baselineValue={baseline?.pilotBaselineMediationHoursPerWeek ?? null}
        />
        <KPICard
          label={MISSION_KPI_LABELS.avgPlacementTime}
          value={kpis.avgPlacementTimeDays}
          current={kpis.recentPlacementTimeDays}
          currentLabel={MISSION_KPI_LABELS.last30Days}
          targetPct={null}
          targetLabel={MISSION_KPI_LABELS.targetDays}
          unit={MISSION_KPI_LABELS.daysUnit}
          baselineValue={null}
        />
        <div className={`rounded-lg border p-4 ${trendStyle.bg}`}>
          <p className="text-sm text-gray-600 mb-1">{MISSION_KPI_LABELS.conflictTrend}</p>
          <p className={`text-2xl font-bold ${trendStyle.text}`}>{trendStyle.label}</p>
          <p className="text-xs text-gray-500 mt-2">{kpis.trendDetail}</p>
        </div>
      </div>

      {/* Monthly Sparklines */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MiniChart
          label={MISSION_KPI_LABELS.conflictsMonthlyChart}
          data={kpis.incidentsPerMonth}
          color="text-orange-500"
          barColor="bg-orange-400"
          baseline={baseline?.pilotBaselineIncidentsPerMonth ?? null}
        />
        <MiniChart
          label={MISSION_KPI_LABELS.relocationsMonthlyChart}
          data={kpis.conflictRelocationsPerMonth}
          color="text-red-500"
          barColor="bg-red-400"
          baseline={baseline?.pilotBaselineRelocationsPerMonth ?? null}
        />
        <MiniChart
          label={MISSION_KPI_LABELS.mediationMonthlyChart}
          data={kpis.mediationMinutesPerMonth}
          color="text-purple-500"
          barColor="bg-purple-400"
          baseline={baseline?.pilotBaselineMediationHoursPerWeek !== null && baseline?.pilotBaselineMediationHoursPerWeek !== undefined
            ? Math.round(baseline.pilotBaselineMediationHoursPerWeek * 4.33 * 10) / 10
            : null}
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
  targetPct,
  targetLabel,
  unit,
  baselineValue,
}: {
  label: string
  value: number | null
  current: number | null
  currentLabel: string
  targetPct: number | null
  targetLabel?: string
  unit: string
  baselineValue: number | null
}) {
  const hasBaseline = baselineValue !== null && baselineValue > 0
  const reductionPct = hasBaseline && value !== null ? pctChange(value, baselineValue!) : null
  const targetValue = hasBaseline && targetPct ? baselineValue! * (1 - targetPct / 100) : null

  // Progress toward target: 0% = at baseline, 100% = at target
  const progressPct =
    hasBaseline && targetPct && value !== null
      ? Math.min(100, Math.max(0, Math.round(((baselineValue! - value) / (baselineValue! * targetPct / 100)) * 100)))
      : null

  const isAchieved = progressPct !== null && progressPct >= 100

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

      {hasBaseline ? (
        <div className="mt-2 space-y-1.5">
          {/* Baseline reference */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">{PILOT_BASELINE_LABELS.baselineLabel}: {baselineValue}</span>
            {targetValue !== null && (
              <span className="text-gray-400">{PILOT_BASELINE_LABELS.targetLabel}: {Math.round(targetValue * 10) / 10}</span>
            )}
          </div>
          {/* Progress bar */}
          {progressPct !== null && (
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${isAchieved ? 'bg-emerald-500' : 'bg-aoz-primary'}`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          )}
          {/* Reduction label */}
          {reductionPct !== null && (
            <p className={`text-xs font-medium ${reductionPct > 0 ? 'text-emerald-600' : reductionPct < 0 ? 'text-red-500' : 'text-gray-500'}`}>
              {reductionPct > 0 ? `↓ ${reductionPct}%` : reductionPct < 0 ? `↑ ${Math.abs(reductionPct)}%` : '→ 0%'}{' '}
              {PILOT_BASELINE_LABELS.baselineLabel.toLowerCase()}
              {targetPct && (
                <span className="text-gray-400 font-normal"> · Ziel: -{targetPct}%</span>
              )}
            </p>
          )}
        </div>
      ) : (
        <p className="text-xs text-gray-400 mt-1">
          {targetLabel ? `Ziel: ${targetLabel}` : targetPct ? `Ziel: -${targetPct}%` : ''}
        </p>
      )}
    </div>
  )
}

function MiniChart({
  label,
  data,
  color,
  barColor,
  baseline,
}: {
  label: string
  data: { label: string; value: number }[]
  color: string
  barColor: string
  baseline: number | null
}) {
  const maxValue = Math.max(...data.map(d => d.value), baseline ?? 0, 1)

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className={`text-sm font-medium ${color} mb-3`}>{label}</p>
      <div className="relative flex items-end gap-1 h-16">
        {/* Baseline reference line */}
        {baseline !== null && baseline > 0 && (
          <div
            className="absolute inset-x-0 border-t-2 border-dashed border-gray-300 pointer-events-none"
            style={{ bottom: `${(baseline / maxValue) * 100}%` }}
            title={`${PILOT_BASELINE_LABELS.baselineLabel}: ${baseline}`}
          />
        )}
        {data.map((d, i) => (
          <div key={i} className="flex-1 h-full flex flex-col justify-end">
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
        {baseline !== null && (
          <span className="text-[11px] text-gray-400">— {PILOT_BASELINE_LABELS.baselineLabel} {baseline}</span>
        )}
        <span className="text-[11px] text-gray-400">{data[data.length - 1]?.label}</span>
      </div>
    </div>
  )
}
