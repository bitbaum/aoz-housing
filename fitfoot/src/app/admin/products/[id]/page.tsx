import Link from 'next/link'
import { notFound } from 'next/navigation'
import { asc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { products, productVariants } from '@/db/schema'
import { ProductForm } from '@/components/admin/ProductForm'
import { VariantManager } from '@/components/admin/VariantManager'
import { DuplicateProductButton } from '@/components/admin/DuplicateProductButton'

export default async function AdminProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1)
  if (!product) notFound()

  const variants = await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, product.id))
    .orderBy(asc(productVariants.size))

  return (
    <div>
      <Link href="/admin/products" className="text-sm text-muted hover:text-ink">
        ← All products
      </Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-3xl">{product.name}</h1>
        <span className="flex gap-2">
          <Link href={`/shop/${product.slug}`} className="btn-ghost text-sm">
            View in shop →
          </Link>
          <DuplicateProductButton productId={product.id} />
        </span>
      </div>
      {!product.active && (
        <p className="mt-2 inline-flex rounded bg-subtle px-2.5 py-0.5 text-xs font-semibold text-muted">
          Not visible in the shop
        </p>
      )}

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="font-heading text-xl">Details</h2>
          <div className="mt-3">
            <ProductForm
              productId={product.id}
              initial={{
                slug: product.slug,
                name: product.name,
                category: product.category,
                productType: product.productType,
                conditionGrade: product.conditionGrade ?? '',
                brand: product.brand,
                gender: product.gender,
                shortDescription: product.shortDescription,
                description: product.description,
                materials: product.materials,
                careInstructions: product.careInstructions,
                origin: product.origin,
                sustainabilityNotes: product.sustainabilityNotes,
                sustainabilityFeatures: product.sustainabilityFeatures,
                priceChf: (product.priceRappen / 100).toFixed(2),
                compareAtChf: product.compareAtRappen
                  ? (product.compareAtRappen / 100).toFixed(2)
                  : '',
                imageUrl: product.imageUrl,
                active: product.active,
              }}
            />
          </div>
        </div>

        <div>
          <h2 className="font-heading text-xl">Sizes & stock</h2>
          <div className="mt-3">
            <VariantManager
              productId={product.id}
              variants={variants.map((v) => ({
                id: v.id,
                sku: v.sku,
                size: v.size,
                color: v.color,
                stockQty: v.stockQty,
              }))}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
