import { notFound } from 'next/navigation'
import { getProductBySlug } from '@/lib/catalog'
import { ProductImage } from '@/components/shop/ProductImage'
import { Price } from '@/components/shop/Price'
import { AddToCartForm } from '@/components/shop/AddToCartForm'
import { CONDITION_LABELS } from '@/config/labels'

export const dynamic = 'force-dynamic'

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const result = await getProductBySlug(slug)
  if (!result) notFound()
  const { product, variants } = result

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded border border-line">
          <ProductImage imageUrl={product.imageUrl} name={product.name} category={product.category} />
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            {product.productType === 'REFURBISHED' ? (
              <span className="badge-success">
                Refurbished
                {product.conditionGrade
                  ? ` · ${CONDITION_LABELS[product.conditionGrade] ?? product.conditionGrade}`
                  : ''}
              </span>
            ) : (
              <span className="badge-gold">New</span>
            )}
            <span className="badge-neutral">{product.brand}</span>
            <span className="badge-neutral">Made in {product.origin}</span>
          </div>

          <h1 className="mt-4 font-heading text-3xl sm:text-4xl">{product.name}</h1>
          <div className="mt-4">
            <Price
              priceRappen={product.priceRappen}
              compareAtRappen={product.compareAtRappen}
              size="lg"
            />
            <p className="mt-1 text-sm text-muted">incl. VAT, free shipping over CHF 100</p>
          </div>

          <p className="mt-6 text-ink">{product.description}</p>

          {product.sustainabilityNotes && (
            <p className="mt-4 rounded bg-success p-3 text-sm font-medium text-success-text">
              🌱 {product.sustainabilityNotes}
            </p>
          )}

          <AddToCartForm
            variants={variants.map((v) => ({
              id: v.id,
              size: v.size,
              color: v.color,
              stockQty: v.stockQty,
            }))}
          />

          <dl className="mt-10 space-y-4 border-t border-line pt-6 text-sm">
            {product.materials && (
              <div>
                <dt className="font-semibold">Materials</dt>
                <dd className="mt-1 text-muted">{product.materials}</dd>
              </div>
            )}
            {product.sustainabilityFeatures.length > 0 && (
              <div>
                <dt className="font-semibold">Sustainability</dt>
                <dd className="mt-2 flex flex-wrap gap-2">
                  {product.sustainabilityFeatures.map((feature) => (
                    <span key={feature} className="badge-success">
                      {feature}
                    </span>
                  ))}
                </dd>
              </div>
            )}
            {product.careInstructions && (
              <div>
                <dt className="font-semibold">Care</dt>
                <dd className="mt-1 text-muted">{product.careInstructions}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  )
}
