import { CircleCheck, CircleDashed } from 'lucide-react'
import {
  INTEGRATION_PRINCIPLES,
  JOB_RESEARCH_SOURCES,
  type PrincipleStatus,
} from '@/lib/config/job-integration-docs'
import { JOB_KPI_DEFS, LAGGING_TARGETS } from '@/lib/analytics/role-kpis'
import { INTEGRATION_TAB_LABELS } from '@/lib/constants/labels/integration-tab'
import { ResearchSourceTable } from './ResearchSourceTable'
import { EvidenceStrengthBadge } from './shared'

/**
 * The evidence behind labour-market integration — the counterpart to ScienceTab.
 *
 * Until this existed, `JOB_RESEARCH_SOURCES` and `INTEGRATION_PRINCIPLES` were
 * imported by nothing but the queue and its tests: a Jobcoach acted on
 * "Vermittlung wirkt vor Qualifizierung" with no page anywhere explaining why,
 * while the housing side had five tabs of methodology. Evidence a caseworker
 * cannot read is evidence that cannot be argued with, which is the same
 * objection this product makes to black-box compatibility scores.
 *
 * The `status` field is rendered rather than hidden. A principle the software
 * does NOT act on is marked as such — an evidence page that implies more than
 * the product does would be worse than none.
 */

const STATUS_STYLE: Record<PrincipleStatus, { icon: typeof CircleCheck; text: string }> = {
  signal: { icon: CircleCheck, text: INTEGRATION_TAB_LABELS.statusSignal },
  documented: { icon: CircleDashed, text: INTEGRATION_TAB_LABELS.statusDocumented },
}

export function IntegrationTab() {
  const sourceTitle = new Map(JOB_RESEARCH_SOURCES.map((s) => [s.id, s.title]))

  return (
    <div className="space-y-6">
      <section className="card">
        <h3 className="font-semibold text-ui-text mb-1">{INTEGRATION_TAB_LABELS.introTitle}</h3>
        <p className="text-sm text-ui-muted leading-relaxed">{INTEGRATION_TAB_LABELS.introBody}</p>
        <p className="mt-3 text-sm text-ui-muted leading-relaxed">
          {INTEGRATION_TAB_LABELS.transferCaution}
        </p>
      </section>

      <section className="card">
        <h3 className="font-semibold text-ui-text mb-4">
          {INTEGRATION_TAB_LABELS.principlesTitle}
        </h3>
        <ul className="space-y-4">
          {INTEGRATION_PRINCIPLES.map((principle) => {
            const style = STATUS_STYLE[principle.status]
            const Icon = style.icon
            return (
              <li key={principle.id} className="rounded-lg border border-ui-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <h4 className="font-medium text-ui-text">{principle.title}</h4>
                  <span className="flex shrink-0 items-center gap-1 text-2xs text-ui-muted">
                    <Icon className="h-4 w-4" aria-hidden />
                    {style.text}
                  </span>
                </div>
                <p className="mt-2 text-sm text-ui-text leading-relaxed">{principle.claim}</p>
                <p className="mt-2 text-sm text-ui-muted leading-relaxed">
                  <span className="eyebrow mr-1">{INTEGRATION_TAB_LABELS.implication}</span>
                  {principle.implication}
                </p>
                <p className="mt-2 text-2xs text-ui-muted">
                  {INTEGRATION_TAB_LABELS.basis}{' '}
                  {principle.sourceIds.map((id) => sourceTitle.get(id) ?? id).join(' · ')}
                </p>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="card">
        <h3 className="font-semibold text-ui-text mb-1">{INTEGRATION_TAB_LABELS.kpiTitle}</h3>
        <p className="text-sm text-ui-muted mb-4">{INTEGRATION_TAB_LABELS.kpiBody}</p>
        <ul className="space-y-2">
          {JOB_KPI_DEFS.map((kpi) => (
            <li key={kpi.id} className="text-sm">
              <span className="font-medium text-ui-text">{kpi.label}</span>
              <span className="text-ui-muted"> — {kpi.help}</span>
            </li>
          ))}
        </ul>

        <div className="mt-5 border-t border-ui-border pt-4">
          <p className="eyebrow">{INTEGRATION_TAB_LABELS.laggingTitle}</p>
          <p className="mt-1 mb-2 text-xs text-ui-muted">{INTEGRATION_TAB_LABELS.laggingBody}</p>
          <ul className="space-y-1">
            {LAGGING_TARGETS.map((target) => (
              <li key={target.text} className="text-sm text-ui-text leading-relaxed">
                {target.text}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <ResearchSourceTable sources={JOB_RESEARCH_SOURCES} />

      <section className="card">
        <h3 className="font-semibold text-ui-text mb-3">{INTEGRATION_TAB_LABELS.strengthTitle}</h3>
        <div className="flex flex-wrap gap-3">
          {(['strong', 'moderate', 'preliminary'] as const).map((strength) => (
            <EvidenceStrengthBadge key={strength} strength={strength} />
          ))}
        </div>
      </section>
    </div>
  )
}
