import Link from 'next/link'
import { HERO, IMPACT_STATS, TRUST_BADGES, TWO_PATHS } from '@/config/site'
import { featuredProducts } from '@/lib/catalog'
import { ProductCard } from '@/components/shop/ProductCard'
import { ProductArt } from '@/components/shop/ProductArt'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const favorites = await featuredProducts().catch(() => [])

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-gold-50 to-white">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:gap-16 lg:py-28">
          <div className="text-center lg:text-left">
            <h1 className="h1-display">
              {HERO.headline}
              <br />
              <span className="gold-text-gradient">{HERO.headlineAccent}</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted lg:mx-0">{HERO.sub}</p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
              <Link href="/shop" className="btn-gold w-full sm:w-auto">
                {HERO.ctaPrimary}
              </Link>
              <Link href="/sustainability" className="btn-outline-gold w-full sm:w-auto">
                {HERO.ctaSecondary}
              </Link>
            </div>
            <ul className="mt-10 flex flex-col items-center justify-center gap-3 text-sm text-muted sm:flex-row sm:gap-8 lg:justify-start">
              {TRUST_BADGES.map((badge) => (
                <li key={badge} className="flex items-center gap-2">
                  <span className="text-gold-500" aria-hidden>
                    ✓
                  </span>
                  {badge}
                </li>
              ))}
            </ul>
          </div>
          <div className="hidden overflow-hidden rounded-lg border border-line shadow-lifted lg:block">
            <ProductArt category="SNEAKERS" className="aspect-[5/4]" />
          </div>
        </div>
      </section>

      {/* Two paths */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="text-center font-heading text-3xl sm:text-4xl">{TWO_PATHS.headline}</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-muted">{TWO_PATHS.sub}</p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {[
            { path: TWO_PATHS.newPath, art: 'RUNNING' as const },
            { path: TWO_PATHS.refurbishedPath, art: 'BOOTS' as const },
          ].map(({ path, art }) => (
            <div
              key={path.title}
              className="flex flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-card"
            >
              <ProductArt category={art} className="aspect-[16/7]" />
              <div className="flex flex-1 flex-col p-6">
                <h3 className="font-heading text-2xl">{path.title}</h3>
                <p className="mt-3 text-muted">{path.body}</p>
                <ul className="mt-4 flex-1 space-y-2 text-sm text-ink">
                  {path.points.map((point) => (
                    <li key={point} className="flex items-center gap-2">
                      <span className="text-gold-500" aria-hidden>
                        ✓
                      </span>
                      {point}
                    </li>
                  ))}
                </ul>
                <Link href={path.href} className="btn-dark mt-6">
                  {path.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Customer favorites */}
      {favorites.length > 0 && (
        <section className="bg-subtle">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
            <h2 className="text-center font-heading text-3xl sm:text-4xl">Customer favorites</h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-muted">
              The shoes our community loves most, chosen for comfort, style, and impact
            </p>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {favorites.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Impact */}
      <section className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6">
        <h2 className="font-heading text-3xl sm:text-4xl">Your impact so far</h2>
        <div className="mt-10 grid gap-8 sm:grid-cols-3">
          {IMPACT_STATS.map((stat) => (
            <div key={stat.label}>
              <p className="gold-text-gradient font-heading text-5xl">{stat.value}</p>
              <p className="mt-2 text-muted">{stat.label}</p>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-8 max-w-2xl text-muted">
          Every pair you choose makes a difference. Join our community of conscious consumers
          creating positive change.
        </p>
      </section>

      {/* Final CTA */}
      <section className="gold-gradient">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center text-white sm:px-6">
          <h2 className="font-heading text-3xl sm:text-4xl">Ready to step forward?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-white/90">
            Join thousands who&apos;ve already made the switch to sustainable footwear. Your perfect
            pair is waiting.
          </p>
          <Link
            href="/shop"
            className="mt-8 inline-flex min-h-[44px] items-center justify-center rounded bg-surface px-8 py-3 font-semibold text-gold-600 transition-colors hover:bg-gold-50"
          >
            Shop the collection
          </Link>
        </div>
      </section>
    </>
  )
}
