import Link from 'next/link'
import { asc, eq, sql } from 'drizzle-orm'
import { db } from '@/db'
import { products, productVariants } from '@/db/schema'
import { formatRappen } from '@/lib/money'

export default async function AdminProductsPage() {
  const rows = await db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      category: products.category,
      productType: products.productType,
      priceRappen: products.priceRappen,
      active: products.active,
      totalStock: sql<number>`coalesce(sum(${productVariants.stockQty}), 0)`,
      variantCount: sql<number>`count(${productVariants.id})`,
    })
    .from(products)
    .leftJoin(productVariants, eq(productVariants.productId, products.id))
    .groupBy(products.id)
    .orderBy(asc(products.name))

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-3xl">Products</h1>
        <Link href="/admin/products/new" className="btn-gold text-sm">
          + New product
        </Link>
      </div>

      <ul className="mt-6 space-y-2">
        {rows.map((product) => (
          <li key={product.id}>
            <Link
              href={`/admin/products/${product.id}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded border border-line p-4 hover:bg-subtle"
            >
              <span>
                <span className="font-medium">{product.name}</span>
                <span className="block text-sm text-muted">
                  {product.category} · {product.productType}
                  {!product.active && ' · INACTIVE'}
                </span>
              </span>
              <span className="flex items-center gap-4 text-sm">
                <span
                  className={
                    Number(product.totalStock) <= 3 ? 'font-semibold text-error-text' : 'text-muted'
                  }
                >
                  {product.totalStock} in stock · {product.variantCount} sizes
                </span>
                <span className="font-semibold">{formatRappen(product.priceRappen)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
