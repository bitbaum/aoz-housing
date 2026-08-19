import Link from 'next/link'
import type { Metadata } from 'next'
import { listProducts } from '@/lib/catalog'
import { ProductCard } from '@/components/shop/ProductCard'
import { PRODUCT_CATEGORIES } from '@/config/database'
import { CATEGORY_LABELS } from '@/config/labels'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Shop',
}

interface ShopFilters {
  type?: string
  category?: string
}

interface ShopPageProps {
  searchParams: Promise<ShopFilters>
}

function filterHref(base: ShopFilters, patch: Partial<ShopFilters>) {
  const merged = { ...base, ...patch }
  const params = new URLSearchParams()
  if (merged.type) params.set('type', merged.type)
  if (merged.category) params.set('category', merged.category)
  const qs = params.toString()
  return qs ? `/shop?${qs}` : '/shop'
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const filters = await searchParams
  const products = await listProducts(filters)

  const typeFilters = [
    { label: 'All', value: undefined },
    { label: 'New', value: 'NEW' },
    { label: 'Refurbished', value: 'REFURBISHED' },
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-heading text-3xl sm:text-4xl">
        Find shoes that feel good <span className="gold-text-gradient">inside and out</span>
      </h1>
      <p className="mt-3 max-w-2xl text-muted">
        Every pair in our collection is chosen for comfort, style, and positive environmental
        impact. New eco-friendly designs or expertly refurbished favorites.
      </p>

      {/* Filters */}
      <div className="mt-8 flex flex-wrap items-center gap-2">
        {typeFilters.map((f) => (
          <Link
            key={f.label}
            href={filterHref(filters, { type: f.value })}
            className={`inline-flex min-h-[44px] items-center rounded border px-4 py-2 text-sm font-medium transition-colors ${
              (filters.type ?? undefined) === f.value
                ? 'border-gold-500 bg-gold-50 text-gold-700'
                : 'border-line text-muted hover:border-line-strong'
            }`}
          >
            {f.label}
          </Link>
        ))}
        <span className="mx-2 hidden h-6 w-px bg-line-strong sm:block" aria-hidden />
        {PRODUCT_CATEGORIES.map((cat) => (
          <Link
            key={cat}
            href={filterHref(filters, {
              category: filters.category === cat ? undefined : cat,
            })}
            className={`inline-flex min-h-[44px] items-center rounded border px-4 py-2 text-sm font-medium transition-colors ${
              filters.category === cat
                ? 'border-gold-500 bg-gold-50 text-gold-700'
                : 'border-line text-muted hover:border-line-strong'
            }`}
          >
            {CATEGORY_LABELS[cat] ?? cat}
          </Link>
        ))}
      </div>

      <p className="mt-4 text-sm text-muted">
        {products.length} {products.length === 1 ? 'pair' : 'pairs'} found
      </p>

      {products.length === 0 ? (
        <div className="mt-8 rounded border border-dashed border-line p-12 text-center">
          <p className="text-muted">No products match these filters yet.</p>
          <Link href="/shop" className="btn-outline-gold mt-4">
            Clear filters
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
