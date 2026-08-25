import type { Metadata } from 'next'
import Link from 'next/link'
import { requireResidentCookie, getPortalAuth } from '@/lib/portal-auth'
import { getRequestTranslator } from '@/lib/i18n/request'
import { EmptyState, PageHeader, PageShell, SectionHeader } from '@/components/ui/Page'
import { MarketplacePostForm } from '@/components/portal/MarketplacePostForm'
import { formatZurichDateTime } from '@/lib/utils/local-time'
import {
  MARKETPLACE_KINDS,
  MARKETPLACE_CATEGORY_LABEL_KEYS,
  MARKETPLACE_NATURE_LABEL_KEYS,
  MARKETPLACE_NATURES,
  MARKETPLACE_STATUS_LABEL_KEYS,
  type MarketplaceNature,
} from '@/lib/config/marketplace'
import {
  listPortalMarketplacePosts,
  createMarketplacePost,
  claimMarketplacePost,
  closeMarketplacePost,
  releaseMarketplaceClaim,
  reopenMarketplacePost,
  deleteMarketplacePost,
  type MarketplacePostSummary,
} from '@/lib/actions/marketplace'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestTranslator()
  return { title: t('nav.marketplace') }
}
export const dynamic = 'force-dynamic'

const STATUS_BADGE: Record<string, string> = {
  OPEN: 'badge-active',
  CLAIMED: 'badge-pending',
  CLOSED: 'badge-ended',
}

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

async function submitReleaseClaim(formData: FormData): Promise<void> {
  'use server'
  await releaseMarketplaceClaim(formData)
}

async function submitReopenPost(formData: FormData): Promise<void> {
  'use server'
  await reopenMarketplacePost(formData)
}

async function submitDeletePost(formData: FormData): Promise<void> {
  'use server'
  await deleteMarketplacePost(formData)
}

type Props = { searchParams: Promise<{ nature?: string }> }

export default async function PortalMarketplacePage({ searchParams }: Props) {
  await requireResidentCookie('/login')
  const { nature: requested } = await searchParams
  const { t } = await getRequestTranslator()

  const nature = (MARKETPLACE_NATURES as readonly string[]).includes(requested ?? '')
    ? (requested as MarketplaceNature)
    : undefined

  const [auth, posts] = await Promise.all([
    getPortalAuth(),
    listPortalMarketplacePosts(nature),
  ])
  const me = auth?.resident.id ?? null

  function ActionButton({
    action,
    id,
    label,
    variant = 'btn-outline',
  }: {
    action: (formData: FormData) => void
    id: string
    label: string
    variant?: string
  }) {
    return (
      <form action={action}>
        <input type="hidden" name="id" value={id} />
        <button type="submit" className={`${variant} min-h-[44px] px-4`}>
          {label}
        </button>
      </form>
    )
  }

  function renderPost(post: MarketplacePostSummary) {
    const isPoster = post.postedById === me
    const isClaimer = post.claimedById === me

    return (
      <article key={post.id} className="card">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-ui-text">{post.title}</span>
          <span className={`badge ${STATUS_BADGE[post.status]}`}>
            {t(MARKETPLACE_STATUS_LABEL_KEYS[post.status])}
          </span>
          <span className="chip chip-neutral">{t(MARKETPLACE_KINDS[post.kind].labelKey)}</span>
          {isPoster ? <span className="chip chip-info">{t('marketplace.mine')}</span> : null}
        </div>

        <p className="mt-1 text-sm text-ui-muted">{post.description}</p>

        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ui-muted">
          <span>{t(MARKETPLACE_CATEGORY_LABEL_KEYS[post.category] ?? 'marketplace.categoryOther')}</span>
          <span>{t('marketplace.postedBy')}: {post.postedByName}</span>
          <span className="numeric">{t('marketplace.postedAgo')}: {formatZurichDateTime(post.createdAt)}</span>
          {post.claimedByName ? (
            <span>{t('marketplace.claimedBy')}: {post.claimedByName}</span>
          ) : null}
        </div>

        {/* Only ever reaches the two people the handover is between — the
            server drops it from the payload for everyone else. */}
        {post.contactNote ? (
          <p className="mt-2 rounded-md bg-ui-subtle px-3 py-2 text-sm text-ui-text">
            <span className="eyebrow">{t('marketplace.contactLabel')}</span>{' '}
            {post.contactNote}
          </p>
        ) : null}

        <div className="mt-3 flex flex-wrap gap-2">
          {post.status === 'OPEN' && !isPoster ? (
            <ActionButton
              action={submitClaimPost}
              id={post.id}
              label={t(MARKETPLACE_KINDS[post.kind].claimLabelKey)}
            />
          ) : null}

          {post.status === 'OPEN' && isPoster ? (
            <ActionButton
              action={submitDeletePost}
              id={post.id}
              label={t('marketplace.delete')}
              variant="btn-ghost"
            />
          ) : null}

          {post.status === 'CLAIMED' && (isPoster || isClaimer) ? (
            <>
              <ActionButton action={submitClosePost} id={post.id} label={t('marketplace.close')} />
              <ActionButton
                action={submitReleaseClaim}
                id={post.id}
                label={t('marketplace.release')}
                variant="btn-ghost"
              />
            </>
          ) : null}

          {post.status === 'CLOSED' && isPoster ? (
            <ActionButton
              action={submitReopenPost}
              id={post.id}
              label={t('marketplace.reopen')}
              variant="btn-ghost"
            />
          ) : null}
        </div>
      </article>
    )
  }

  const own = posts?.own ?? []
  const open = posts?.open ?? []

  return (
    <PageShell>
      <PageHeader title={t('marketplace.title')} description={t('marketplace.subtitle')} />

      {/* Stated where people post, not buried in help: this board carries no
          money, and paid work has its own channel with its own permit check. */}
      <p className="text-sm text-ui-muted">{t('marketplace.noMoney')}</p>

      <nav className="flex flex-wrap gap-2" aria-label={t('marketplace.title')}>
        <FilterLink href="/portal/marketplace" active={!nature}>
          {t('marketplace.filterAll')}
        </FilterLink>
        {MARKETPLACE_NATURES.map((value) => (
          <FilterLink
            key={value}
            href={`/portal/marketplace?nature=${value}`}
            active={nature === value}
          >
            {t(MARKETPLACE_NATURE_LABEL_KEYS[value])}
          </FilterLink>
        ))}
      </nav>

      {/* Without a placement the create action has no unit to file a post
          under and returns an error the page throws away — so the form looked
          normal, accepted a post, and did nothing at all. Say so instead. */}
      {posts ? (
        <MarketplacePostForm action={submitCreatePost} />
      ) : (
        <EmptyState title={t('placement.none')} />
      )}

      {!posts ? null : own.length === 0 && open.length === 0 ? (
        <EmptyState title={t('marketplace.emptyOpen')} />
      ) : (
        <>
          {own.length > 0 ? (
            <section className="space-y-3">
              <SectionHeader title={t('marketplace.ownUnit')} />
              {own.map(renderPost)}
            </section>
          ) : null}
          {open.length > 0 ? (
            <section className="space-y-3">
              <SectionHeader
                title={t('marketplace.otherUnits')}
                description={t('marketplace.openOnly')}
              />
              {open.map(renderPost)}
            </section>
          ) : null}
        </>
      )}
    </PageShell>
  )
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string
  active: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`min-h-[44px] inline-flex items-center gap-2 rounded-sm px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? 'bg-brand-primary text-ui-on-accent'
          : 'bg-ui-subtle text-ui-muted hover:bg-ui-border'
      }`}
    >
      {children}
    </Link>
  )
}
