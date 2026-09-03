/**
 * The KPIs for one care domain — the counterpart to MissionKPISection, which
 * covers housing and only housing.
 *
 * Every tile states its denominator and, on demand, the evidence behind it.
 * Both are deliberate: a share without a denominator invites reading 1 of 1 as
 * a trend, and a target a caseworker cannot trace to a source is one they
 * cannot argue with — which is the same objection this product already makes
 * to black-box compatibility scores.
 */

import type { KpiValue, RoleKpiDef } from '@/lib/analytics/role-kpis'
import { LAGGING_TARGETS } from '@/lib/analytics/role-kpis'
import { ROLE_KPI_LABELS } from '@/lib/constants/labels/role-kpis'
import { JOB_RESEARCH_SOURCES } from '@/lib/config/job-integration-docs'

interface Props {
  title: string
  defs: readonly RoleKpiDef[]
  values: readonly KpiValue[]
  /** Whether this is the viewer's own caseload or the whole population. */
  scopeNote: string
  /** The long-run targets these leading indicators serve. Job domain only. */
  showLaggingTargets?: boolean
}

function formatValue(def: RoleKpiDef, value: number | null): string {
  if (value === null) return '—'
  return def.format === 'percent' ? `${value}%` : `${value}`
}

export function RoleKPISection({ title, defs, values, scopeNote, showLaggingTargets }: Props) {
  const byId = new Map(values.map((v) => [v.id, v]))
  const sources = new Map(JOB_RESEARCH_SOURCES.map((s) => [s.id, s]))

  return (
    <section className="card" aria-labelledby="role-kpi-title">
      <div className="mb-4">
        <p className="eyebrow">{ROLE_KPI_LABELS.eyebrow}</p>
        <h2 id="role-kpi-title" className="text-lg font-semibold text-ui-text">
          {title}
        </h2>
        <p className="text-sm text-ui-muted mt-1">{scopeNote}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {defs.map((def) => {
          const row = byId.get(def.id)
          const value = row?.value ?? null
          const denominator = row?.denominator ?? 0

          return (
            <div key={def.id} className="rounded-lg border border-ui-border p-4">
              <p className="eyebrow">{def.label}</p>
              <p className="metric mt-1">{formatValue(def, value)}</p>
              <p className="text-xs text-ui-muted mt-1">
                {def.format === 'days' ? ROLE_KPI_LABELS.unitDays : ''}
                {/* Says WHAT the share is of. Without it "100%" of a caseload
                    of one reads like a result. */}
                {value === null
                  ? ROLE_KPI_LABELS.noCaseload
                  : ROLE_KPI_LABELS.denominator(denominator)}
              </p>
              <p className="text-xs text-ui-muted mt-2 leading-relaxed">{def.help}</p>
              <p className="text-2xs text-ui-muted mt-2">
                {ROLE_KPI_LABELS.basis}{' '}
                {def.sourceIds.map((id) => sources.get(id)?.title ?? id).join(' · ')}
              </p>
            </div>
          )
        })}
      </div>

      {showLaggingTargets && (
        <div className="mt-5 border-t border-ui-border pt-4">
          <p className="eyebrow">{ROLE_KPI_LABELS.laggingTitle}</p>
          <p className="text-xs text-ui-muted mt-1 mb-2">{ROLE_KPI_LABELS.laggingHelp}</p>
          <ul className="space-y-1">
            {LAGGING_TARGETS.map((target) => (
              <li key={target.text} className="text-sm text-ui-text leading-relaxed">
                {target.text}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
