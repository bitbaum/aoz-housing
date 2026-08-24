import Link from 'next/link'
import { Sprout } from 'lucide-react'
import { setupCta } from '@/lib/config/dashboard'
import type { StaffRole } from '@/lib/auth/role-policy'
import { DASHBOARD_LABELS } from '@/lib/constants/labels'

/**
 * What the dashboard shows when the workspace holds no people yet.
 *
 * This is NOT the all-clear state wearing different words. Every queue being
 * empty because the work is done and every queue being empty because nothing
 * was ever entered look identical to a `.length === 0` check, and the page
 * used to report both as "Alles erledigt!" — telling a team that had not
 * started that they were finished. @see lib/config/dashboard.ts
 *
 * Neutral, not celebratory, and never a green tick: an empty database is a
 * starting point, so this block says so and points at the first real step
 * the signed-in role is actually allowed to take.
 */
export function EmptyWorkspaceState({
  role,
  housingUnitCount,
}: {
  role: StaffRole
  housingUnitCount: number
}) {
  const cta = setupCta(role, { housingUnitCount })

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
        <div className="flex items-start gap-4">
          <span className="icon-container shrink-0 bg-ui-subtle text-ui-muted">
            <Sprout className="w-5 h-5" aria-hidden="true" />
          </span>
          <div>
            <p className="eyebrow">{DASHBOARD_LABELS.heroEyebrow}</p>
            <h2 className="text-xl sm:text-2xl font-semibold tracking-heading text-ui-text mt-1 text-balance">
              {DASHBOARD_LABELS.emptyTitle}
            </h2>
            <p className="text-ui-muted mt-1 max-w-prose">
              {cta ? DASHBOARD_LABELS.emptyBody : DASHBOARD_LABELS.emptyNoSetupRights}
            </p>
          </div>
        </div>

        {/* No button at all for a role that may not create anything — a CTA
            ending in /kein-zugriff is the dead end PR #88 removed. */}
        {cta && (
          <Link href={cta.href} className="btn-secondary shrink-0 self-start sm:self-auto">
            {DASHBOARD_LABELS[cta.labelKey]}
          </Link>
        )}
      </div>
    </section>
  )
}
