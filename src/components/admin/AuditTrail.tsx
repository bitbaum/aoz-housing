import type { AuditEntry } from '@/lib/audit'
import { AUDIT_LABELS as A } from '@/lib/constants/labels'
import { formatDateTime } from '@/lib/utils'

/**
 * A list of audit entries.
 *
 * One component for the system-wide `/audit` page and for the history shown
 * beside a single client or flat, so the two cannot describe the same entry
 * differently — the third-copy problem this codebase keeps hitting whenever a
 * display layer is written twice.
 *
 * `showEntity` is false where the entity is obvious from context: on a client's
 * own page every row says "Klient*in", which is noise rather than information.
 */
export function AuditTrail({
  entries,
  showEntity = true,
}: {
  entries: AuditEntry[]
  showEntity?: boolean
}) {
  if (entries.length === 0) {
    return <p className="text-sm text-ui-muted">{A.empty}</p>
  }

  return (
    <ul className="space-y-2">
      {entries.map((entry) => (
        <li key={entry.id} className="border-t border-ui-border pt-2 first:border-t-0 first:pt-0">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
            <p className="text-sm text-ui-text">
              {/* A null actor is a real state, not an error: userId is
                  ON DELETE SET NULL, so an entry outlives the account that
                  made it — which is the point of keeping it. */}
              <span className="font-medium">{entry.actorName ?? A.systemActor}</span>{' '}
              {A.actions[entry.action] ?? entry.action}
              {showEntity ? `: ${A.entities[entry.entity] ?? entry.entity}` : ''}
            </p>
            <p className="numeric text-xs text-ui-muted">{formatDateTime(entry.createdAt)}</p>
          </div>
          {entry.reason && <p className="mt-1 text-xs text-ui-muted">{entry.reason}</p>}
        </li>
      ))}
    </ul>
  )
}
