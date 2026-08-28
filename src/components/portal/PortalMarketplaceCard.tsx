import Link from 'next/link'
import { getRequestTranslator } from '@/lib/i18n/request'
import type { MarketplacePostSummary } from '@/lib/actions/marketplace'

interface PortalMarketplaceCardProps {
  posts: MarketplacePostSummary[]
}

/**
 * The reader's own marketplace posts, and whether anyone has answered them.
 *
 * The board itself works: posting, claiming, releasing and closing are all
 * implemented and the claim is even race-safe. What it never did was tell
 * anybody. There is no notification and no email, and the dashboard did not
 * mention the marketplace at all — so someone could offer a wardrobe, someone
 * else could claim it, and the first person would find out only by happening
 * to reopen the board. `contactNote`, the whole mechanism by which the two of
 * them arrange the handover, sat on a page nobody was sent to.
 *
 * This is the smallest honest fix: no new table, no email dependency, no
 * notification concept to design. It does not push, but it means a claim is
 * visible the next time the resident opens the app, which is the difference
 * between a match and a stranded match.
 */
export async function PortalMarketplaceCard({ posts }: PortalMarketplaceCardProps) {
  const { t } = await getRequestTranslator()

  // Nothing posted, nothing to say. An empty card claiming a section exists is
  // noise on a dashboard that already has eight of them.
  if (posts.length === 0) return null

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-ui-text">{t('marketplace.yoursTitle')}</h2>
        <Link
          href="/portal/marketplace"
          className="inline-flex items-center min-h-[44px] px-1 text-sm text-brand-primary hover:underline"
        >
          {t('marketplace.title')}
        </Link>
      </div>

      <ul className="space-y-3">
        {posts.map((post) => {
          const claimed = post.status === 'CLAIMED'
          return (
            <li key={post.id}>
              <Link
                href="/portal/marketplace"
                className="block rounded-lg border border-ui-border p-3 hover:border-ui-border-strong hover:bg-ui-subtle"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="font-medium text-ui-text">{post.title}</span>
                  <span className={claimed ? 'chip chip-success' : 'chip chip-neutral'}>
                    {claimed ? t('marketplace.statusClaimed') : t('marketplace.statusOpen')}
                  </span>
                </div>

                {/* Who answered. Without this the card would report that
                    something happened without saying what, which is the same
                    dead end one screen earlier. */}
                {claimed && post.claimedByName && (
                  <p className="text-sm text-ui-muted mt-1">
                    {t('marketplace.claimedBy')}: {post.claimedByName}
                  </p>
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
