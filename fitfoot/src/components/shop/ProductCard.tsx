import Link from 'next/link'
import type { Product } from '@/db/schema'
import { ProductImage } from './ProductImage'
import { Price } from './Price'

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/shop/${product.slug}`}
      className="group overflow-hidden rounded border border-line bg-surface transition-shadow hover:shadow-lifted"
    >
      <div className="relative aspect-square overflow-hidden">
        <ProductImage imageUrl={product.imageUrl} name={product.name} category={product.category} />
        {product.productType === 'REFURBISHED' && (
          <span className="badge-success absolute left-3 top-3">Refurbished</span>
        )}
        {product.compareAtRappen && product.compareAtRappen > product.priceRappen && (
          <span className="badge-gold absolute right-3 top-3">
            −{Math.round((1 - product.priceRappen / product.compareAtRappen) * 100)}%
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold group-hover:text-gold-600">{product.name}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted">{product.shortDescription}</p>
        {product.sustainabilityNotes && (
          <p className="mt-2 text-xs font-medium text-success-text">🌱 {product.sustainabilityNotes}</p>
        )}
        <div className="mt-3">
          <Price priceRappen={product.priceRappen} compareAtRappen={product.compareAtRappen} />
        </div>
      </div>
    </Link>
  )
}
