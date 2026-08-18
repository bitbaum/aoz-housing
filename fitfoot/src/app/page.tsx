import Link from 'next/link'
import { HERO, IMPACT_STATS, TRUST_BADGES, TWO_PATHS } from '@/config/site'
import { featuredProducts } from '@/lib/catalog'
import { ProductCard } from '@/components/shop/ProductCard'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const favorites = await featuredProducts().catch(() => [])

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-gold-50 to-white">
        <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <h1 className="font-heading text-4xl leading-tight sm:text-6xl">
            {HERO.headline}
            <br />
            <span className="gold-text-gradient">{HERO.headlineAccent}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-neutral-600">{HERO.sub}</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/shop" className="btn-gold w-full sm:w-auto">
              {HERO.ctaPrimary}
            </Link>
            <Link href="/sustainability" className="btn-outline-gold w-full sm:w-auto">
              {HERO.ctaSecondary}
            </Link>
          </div>
          <ul className="mt-10 flex flex-col items-center justify-center gap-3 text-sm text-neutral-600 sm:flex-row sm:gap-8">
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
      </section>

      {/* Two paths */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="text-center font-heading text-3xl sm:text-4xl">{TWO_PATHS.headline}</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-neutral-600">{TWO_PATHS.sub}</p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {[TWO_PATHS.newPath, TWO_PATHS.refurbishedPath].map((path) => (
            <div key={path.title} className="card-premium flex flex-col">
              <h3 className="font-heading text-2xl">{path.title}</h3>
              <p className="mt-3 text-neutral-600">{path.body}</p>
              <ul className="mt-4 flex-1 space-y-2 text-sm text-neutral-700">
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
          ))}
        </div>
      </section>

      {/* Customer favorites */}
      {favorites.length > 0 && (
        <section className="bg-neutral-50">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
            <h2 className="text-center font-heading text-3xl sm:text-4xl">Customer favorites</h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-neutral-600">
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
              <p className="mt-2 text-neutral-600">{stat.label}</p>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-8 max-w-2xl text-neutral-600">
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
            className="mt-8 inline-flex min-h-[44px] items-center justify-center rounded bg-white px-8 py-3 font-semibold text-gold-600 transition-colors hover:bg-gold-50"
          >
            Shop the collection
          </Link>
        </div>
      </section>
    </>
  )
}
