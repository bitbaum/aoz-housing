import type { Metadata } from 'next'
import Link from 'next/link'

import { AuditTrail } from '@/components/admin/AuditTrail'
import { PageHeader } from '@/components/ui/Page'
import { requirePermission } from '@/lib/auth'
import { getRecentAuditLogs, type AuditEntity } from '@/lib/audit'
import { AUDIT_LABELS as A } from '@/lib/constants/labels'

export const metadata: Metadata = { title: A.title }
export const dynamic = 'force-dynamic'

/**
 * The audit trail, as something a person can actually read.
 *
 * 120 sites in this codebase wrote to `AuditLog`. Nothing read it. Both
 * readers in `lib/audit.ts` had zero callers — one of them carrying the
 * comment "for admin dashboard", for a dashboard that did not exist.
 *
 * CLAUDE.md promises that every placement is logged with who decided, the
 * scores at the time and any override reason. That was true and useless: the
 * rows were there and no one inside the product could see them.
 *
 * The sharpest case is impersonation. "Ansicht öffnen als" writes STAFF_USER
 * entries, and their reviewability IS the safeguard for the feature — a
 * control nobody can inspect is a claim. Hence the filter, and hence
 * STAFF_USER being one click away rather than buried in a flat feed that the
 * other 119 write sites would drown.
 *
 * `users:manage` — a system-admin permission, like Einstellungen. Reading who
 * did what to whom is administrative oversight, and notably NOT something
 * ALL_DOMAINS grants: the person with reach over every care domain is one of
 * the people this log exists to record.
 */

/** Only the entities a filter chip is worth offering, in the order shown. */
const FILTERS: { id: AuditEntity | 'ALL'; label: string }[] = [
  { id: 'ALL', label: A.filterAll },
  { id: 'STAFF_USER', label: A.entities.STAFF_USER },
  { id: 'PLACEMENT', label: A.entities.PLACEMENT },
  { id: 'RESIDENT', label: A.entities.RESIDENT },
  { id: 'INCIDENT', label: A.entities.INCIDENT },
  { id: 'HOUSING_UNIT', label: A.entities.HOUSING_UNIT },
]

function isFilterableEntity(value: string): value is AuditEntity {
  return FILTERS.some((filter) => filter.id === value && filter.id !== 'ALL')
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ entity?: string }>
}) {
  await requirePermission('users:manage')

  const params = await searchParams
  const active = params.entity && isFilterableEntity(params.entity) ? params.entity : undefined
  const entries = await getRecentAuditLogs(100, active)

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title={A.title} description={A.subtitle} />

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => {
          const isActive = filter.id === 'ALL' ? !active : filter.id === active
          const href = filter.id === 'ALL' ? '/audit' : `/audit?entity=${filter.id}`
          return (
            <Link
              key={filter.id}
              href={href}
              aria-current={isActive ? 'page' : undefined}
              className={`chip min-h-[44px] inline-flex items-center ${
                isActive ? 'chip-info' : 'chip-neutral'
              }`}
            >
              {filter.label}
            </Link>
          )
        })}
      </div>

      {active === 'STAFF_USER' && <p className="text-xs text-ui-muted">{A.impersonationHint}</p>}

      {/* The same component the client and housing pages use. It was written
          twice for a moment, which is how a display layer becomes a third
          copy of a rule and starts disagreeing with itself. */}
      <div className="card">
        <AuditTrail entries={entries} />
      </div>
    </div>
  )
}
