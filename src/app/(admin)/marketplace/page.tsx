import type { Metadata } from 'next'
import { EmptyState, ListShell, PageHeader, PageShell } from '@/components/ui/Page'
import { MARKETPLACE_ADMIN_LABELS } from '@/lib/constants'
import { listStaffMarketplacePosts, hideMarketplacePost, unhideMarketplacePost } from '@/lib/actions/marketplace'
import { getCurrentUser, hasPermission, requirePermission } from '@/lib/auth'

export const metadata: Metadata = { title: MARKETPLACE_ADMIN_LABELS.pageTitle }
export const dynamic = 'force-dynamic'

const STATUS_BADGE: Record<string, string> = {
  OPEN: 'badge-active',
  CLAIMED: 'badge-pending',
  CLOSED: 'badge-ended',
}

async function submitHide(formData: FormData): Promise<void> {
  'use server'
  await hideMarketplacePost(formData)
}

async function submitUnhide(formData: FormData): Promise<void> {
  'use server'
  await unhideMarketplacePost(formData)
}

export default async function MarketplaceAdminPage() {
  await requirePermission('marketplace:read')
  const staff = await getCurrentUser()
  const canModerate = !!staff && hasPermission(staff, 'marketplace:moderate')
  const posts = await listStaffMarketplacePosts()

  return (
    <PageShell>
      <PageHeader
        title={MARKETPLACE_ADMIN_LABELS.pageTitle}
        description={MARKETPLACE_ADMIN_LABELS.pageDescription}
      />

      {posts.length === 0 ? (
        <EmptyState title={MARKETPLACE_ADMIN_LABELS.emptyTitle} />
      ) : (
        <ListShell>
          <div className="divide-y divide-ui-border">
            {posts.map((post) => (
              <div key={post.id} className="px-4 py-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-ui-text">{post.title}</span>
                      <span className={`badge ${STATUS_BADGE[post.status]}`}>
                        {MARKETPLACE_ADMIN_LABELS.status[post.status]}
                      </span>
                      <span className="chip chip-neutral">
                        {MARKETPLACE_ADMIN_LABELS.nature[post.nature]}
                      </span>
                      <span className="chip chip-neutral">
                        {MARKETPLACE_ADMIN_LABELS.kind[post.kind]}
                      </span>
                      {post.hiddenByStaff ? (
                        <span className="badge badge-alert">{MARKETPLACE_ADMIN_LABELS.hiddenBadge}</span>
                      ) : null}
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-ui-muted">{post.description}</p>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-ui-muted">
                      <span>{MARKETPLACE_ADMIN_LABELS.unit}: {post.housingUnitCode}</span>
                      <span>{MARKETPLACE_ADMIN_LABELS.postedBy}: {post.postedByName}</span>
                      {post.claimedByName ? (
                        <span>{MARKETPLACE_ADMIN_LABELS.claimedBy}: {post.claimedByName}</span>
                      ) : null}
                      <span>{MARKETPLACE_ADMIN_LABELS.category[post.category]}</span>
                    </div>
                  </div>
                  {canModerate ? (
                    <form action={post.hiddenByStaff ? submitUnhide : submitHide}>
                      <input type="hidden" name="id" value={post.id} />
                      <button type="submit" className="btn-outline min-h-[44px] px-4">
                        {post.hiddenByStaff
                          ? MARKETPLACE_ADMIN_LABELS.unhide
                          : MARKETPLACE_ADMIN_LABELS.hide}
                      </button>
                    </form>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </ListShell>
      )}
    </PageShell>
  )
}
