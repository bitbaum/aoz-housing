import type { Metadata } from 'next'
import { requireResidentCookie } from '@/lib/portal-auth'
import { getRequestTranslator } from '@/lib/i18n/request'
import { EmptyState, PageHeader, PageShell } from '@/components/ui/Page'
import {
  listPortalMarketplacePosts,
  createMarketplacePost,
  claimMarketplacePost,
  closeMarketplacePost,
  type MarketplacePostSummary,
} from '@/lib/actions/marketplace'
import { MARKETPLACE_STATUS_BADGE } from '@/lib/constants'

export const metadata: Metadata = { title: 'Marktplatz' }
export const dynamic = 'force-dynamic'

async function submitCreatePost(formData: FormData): Promise<void> {
  'use server'
  await createMarketplacePost(formData)
}

async function submitClaimPost(formData: FormData): Promise<void> {
  'use server'
  await claimMarketplacePost(formData)
}

async function submitClosePost(formData: FormData): Promise<void> {
  'use server'
  await closeMarketplacePost(formData)
}

export default async function PortalMarketplacePage() {
  await requireResidentCookie('/login')
  const { t } = await getRequestTranslator()
  const posts = await listPortalMarketplacePosts()

  const kindLabels: Record<string, string> = {
    GIVE_AWAY: t('marketplace.kindGiveAway'),
    LEND: t('marketplace.kindLend'),
    WANTED: t('marketplace.kindWanted'),
  }
  const categoryLabels: Record<string, string> = {
    FURNITURE: t('marketplace.categoryFurniture'),
    KITCHEN: t('marketplace.categoryKitchen'),
    CLOTHING: t('marketplace.categoryClothing'),
    ELECTRONICS: t('marketplace.categoryElectronics'),
    KIDS: t('marketplace.categoryKids'),
    OTHER: t('marketplace.categoryOther'),
  }
  const statusLabels: Record<string, string> = {
    OPEN: t('marketplace.statusOpen'),
    CLAIMED: t('marketplace.statusClaimed'),
    CLOSED: t('marketplace.statusClosed'),
  }

  function renderPost(post: MarketplacePostSummary) {
    return (
      <div key={post.id} className="card">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-ui-text">{post.title}</span>
          <span className={`badge ${MARKETPLACE_STATUS_BADGE[post.status]}`}>{statusLabels[post.status]}</span>
          <span className="chip chip-neutral">{kindLabels[post.kind]}</span>
        </div>
        <p className="mt-1 text-sm text-ui-muted">{post.description}</p>
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-ui-muted">
          <span>{categoryLabels[post.category]}</span>
          <span>{t('marketplace.postedBy')}: {post.postedByName}</span>
          {post.claimedByName ? (
            <span>{t('marketplace.claimedBy')}: {post.claimedByName}</span>
          ) : null}
        </div>
        {post.status === 'OPEN' ? (
          <form action={submitClaimPost} className="mt-3">
            <input type="hidden" name="id" value={post.id} />
            <button type="submit" className="btn-outline min-h-[44px] px-4">
              {t('marketplace.claim')}
            </button>
          </form>
        ) : null}
        {post.status === 'CLAIMED' ? (
          <form action={submitClosePost} className="mt-3">
            <input type="hidden" name="id" value={post.id} />
            <button type="submit" className="btn-outline min-h-[44px] px-4">
              {t('marketplace.close')}
            </button>
          </form>
        ) : null}
      </div>
    )
  }

  return (
    <PageShell>
      <PageHeader title={t('marketplace.title')} description={t('marketplace.subtitle')} />

      <div className="card">
        <h2 className="text-lg font-semibold text-ui-text mb-4">{t('marketplace.postNew')}</h2>
        <form action={submitCreatePost} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label htmlFor="mp-title" className="label">{t('marketplace.formTitle')}</label>
            <input id="mp-title" name="title" required className="input" />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="mp-description" className="label">{t('marketplace.formDescription')}</label>
            <textarea id="mp-description" name="description" required rows={2} className="input" />
          </div>
          <div>
            <label htmlFor="mp-kind" className="label">{t('marketplace.formKind')}</label>
            <select id="mp-kind" name="kind" required className="input" defaultValue="GIVE_AWAY">
              {Object.entries(kindLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="mp-category" className="label">{t('marketplace.formCategory')}</label>
            <select id="mp-category" name="category" className="input" defaultValue="OTHER">
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="btn-primary min-h-[44px] px-6">
              {t('marketplace.submit')}
            </button>
          </div>
        </form>
      </div>

      {!posts || (posts.own.length === 0 && posts.other.length === 0) ? (
        <EmptyState title={t('marketplace.empty')} />
      ) : (
        <>
          {posts.own.length > 0 ? (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-ui-text">{t('marketplace.ownUnit')}</h2>
              {posts.own.map(renderPost)}
            </div>
          ) : null}
          {posts.other.length > 0 ? (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-ui-text">{t('marketplace.otherUnits')}</h2>
              {posts.other.map(renderPost)}
            </div>
          ) : null}
        </>
      )}
    </PageShell>
  )
}
