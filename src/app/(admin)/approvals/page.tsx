import type { Metadata } from 'next'

import { PageHeader } from '@/components/ui/Page'
import { ReviewFactForm } from '@/components/admin/ReviewFactForm'
import { ownSeat } from '@/lib/client-facts/access'
import { pendingFactQueue } from '@/lib/client-facts/queue'
import { requirePermission } from '@/lib/auth'
import { CLIENT_FACT_LABELS as L } from '@/lib/constants/labels'
import { formatDate } from '@/lib/utils'
import { residentName } from '@/lib/utils/resident-name'

export const metadata: Metadata = { title: L.queueTitle }
export const dynamic = 'force-dynamic'

/**
 * Freigaben — client-entered facts nobody has looked at yet.
 *
 * `clientFacts:read` says only that this person has a queue. WHICH facts they
 * see, and for which clients, is decided per kind against the care seats they
 * hold: Simon opens this page and finds permits for the clients he coaches,
 * never their insurance, never a client he does not hold. The narrowing
 * happens in the QUERY — a kind he may not read is a query never issued, not
 * rows fetched and filtered in the markup.
 */
export default async function ApprovalsPage() {
  const viewer = await requirePermission('clientFacts:read')

  const items = await pendingFactQueue({
    userId: viewer.id,
    scope: viewer.scope,
    ownDomain: ownSeat(viewer.role),
  })

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title={L.queueTitle} description={L.queueSubtitle} />

      <p className="text-xs text-ui-muted">{L.confirmMeaning}</p>

      {items.length === 0 ? (
        <div className="card">
          <p className="text-ui-text">{L.queueEmpty}</p>
          <p className="mt-1 text-sm text-ui-muted">{L.queueEmptyHint}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={`${item.kind}-${item.id}`} className="card">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <p className="eyebrow">{L.kinds[item.kind]}</p>
                  <p className="font-medium text-ui-text">{residentName(item.resident)}</p>
                </div>
                <p className="numeric text-xs text-ui-muted">{formatDate(item.createdAt)}</p>
              </div>

              <p className="mt-2 text-sm text-ui-text">
                {item.kind === 'PERMIT' ? L.permitTypes[item.summary] : item.summary}
              </p>
              {item.validUntil && (
                <p className="numeric mt-1 text-xs text-ui-muted">
                  {L.fields.validUntil}: {formatDate(item.validUntil)}
                </p>
              )}

              <ReviewFactForm id={item.id} kind={item.kind} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
