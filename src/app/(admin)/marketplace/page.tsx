import type { Metadata } from 'next'
import { EmptyState, ListShell, PageHeader, PageShell, SectionHeader } from '@/components/ui/Page'
import { MARKETPLACE_ADMIN_LABELS, MARKETPLACE_STATUS_BADGE } from '@/lib/constants'
import {
  listStaffMarketplacePosts,
  listStaffMarketplaceReports,
  hideMarketplacePost,
  unhideMarketplacePost,
  resolveMarketplaceReport,
} from '@/lib/actions/marketplace'

export const metadata: Metadata = { title: MARKETPLACE_ADMIN_LABELS.pageTitle }
export const dynamic = 'force-dynamic'

async function submitHide(formData: FormData): Promise<void> {
  'use server'
  await hideMarketplacePost(formData)
}

async function submitUnhide(formData: FormData): Promise<void> {
  'use server'
  await unhideMarketplacePost(formData)
}

async function submitResolveReport(formData: FormData): Promise<void> {
  'use server'
  await resolveMarketplaceReport(formData)
}

export default async function MarketplaceAdminPage() {
  const [posts, reports] = await Promise.all([
    listStaffMarketplacePosts(),
    listStaffMarketplaceReports(),
  ])
  const openReports = reports.filter((report) => !report.resolvedAt)

  return (
    <PageShell>
      <PageHeader
        title={MARKETPLACE_ADMIN_LABELS.pageTitle}
        description={MARKETPLACE_ADMIN_LABELS.pageDescription}
      />

      {openReports.length > 0 ? (
        <div className="space-y-3">
          <SectionHeader title={`${MARKETPLACE_ADMIN_LABELS.reportsTitle} (${openReports.length})`} description={MARKETPLACE_ADMIN_LABELS.reportsDescription} />
          <ListShell>
            <div className="divide-y divide-ui-border">
              {openReports.map((report) => (
                <div key={report.id} className="px-4 py-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-ui-text">{report.postTitle}</span>
                        <span className="chip chip-neutral">{report.housingUnitCode}</span>
                      </div>
                      <p className="mt-1 text-sm text-ui-muted">
                        {MARKETPLACE_ADMIN_LABELS.reportReason}: {report.reason}
                      </p>
                      <p className="mt-1 text-xs text-ui-muted">
                        {MARKETPLACE_ADMIN_LABELS.reportedBy}: {report.reportedByName ?? '—'}
                      </p>
                    </div>
                    <form action={submitResolveReport} className="flex flex-wrap items-end gap-2">
                      <input type="hidden" name="id" value={report.id} />
                      <div>
                        <label htmlFor={`resolution-${report.id}`} className="label">
                          {MARKETPLACE_ADMIN_LABELS.resolutionLabel}
                        </label>
                        <input
                          id={`resolution-${report.id}`}
                          name="resolution"
                          className="input"
                          placeholder={MARKETPLACE_ADMIN_LABELS.resolutionPlaceholder}
                        />
                      </div>
                      <button type="submit" className="btn-outline min-h-[44px] px-4">
                        {MARKETPLACE_ADMIN_LABELS.resolve}
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </ListShell>
        </div>
      ) : null}

      {posts.length === 0 ? (
        <EmptyState title={MARKETPLACE_ADMIN_LABELS.emptyTitle} />
      ) : (
        <ListShell>
          <div className="divide-y divide-ui-border">
            {posts.map((post) => {
              const primaryPhoto = post.photos.find((photo) => photo.isPrimary) ?? post.photos[0]
              return (
                <div key={post.id} className="px-4 py-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="flex min-w-0 gap-3">
                      {primaryPhoto ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`/api/marketplace/photos/${primaryPhoto.id}`}
                          alt=""
                          className="h-16 w-16 shrink-0 rounded-lg border border-ui-border object-cover"
                        />
                      ) : null}
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-ui-text">{post.title}</span>
                          <span className={`badge ${MARKETPLACE_STATUS_BADGE[post.status]}`}>
                            {MARKETPLACE_ADMIN_LABELS.status[post.status]}
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
                          <span>{MARKETPLACE_ADMIN_LABELS.postedBy}: {post.postedByName ?? '—'}</span>
                          {post.claimedByName ? (
                            <span>{MARKETPLACE_ADMIN_LABELS.claimedBy}: {post.claimedByName}</span>
                          ) : null}
                          <span>{MARKETPLACE_ADMIN_LABELS.category[post.category]}</span>
                        </div>
                      </div>
                    </div>
                    <form action={post.hiddenByStaff ? submitUnhide : submitHide}>
                      <input type="hidden" name="id" value={post.id} />
                      <button type="submit" className="btn-outline min-h-[44px] px-4">
                        {post.hiddenByStaff
                          ? MARKETPLACE_ADMIN_LABELS.unhide
                          : MARKETPLACE_ADMIN_LABELS.hide}
                      </button>
                    </form>
                  </div>
                </div>
              )
            })}
          </div>
        </ListShell>
      )}
    </PageShell>
  )
}
