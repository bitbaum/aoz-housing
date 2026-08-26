import { CATEGORY_ART } from '@/config/product-art'
import type { ProductCategory } from '@/config/database'

interface ProductArtProps {
  category: string
  className?: string
}

/** Art-directed placeholder for a product with no photo yet: gold duotone + a fine-line category silhouette. */
export function ProductArt({ category, className = '' }: ProductArtProps) {
  const art = CATEGORY_ART[category as ProductCategory] ?? CATEGORY_ART.SNEAKERS

  return (
    <div className={`product-art flex h-full w-full items-center justify-center ${className}`} aria-hidden>
      <svg
        viewBox={art.viewBox}
        className="relative h-2/5 w-3/5 text-gold-600"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={art.base} />
        {art.details.map((d) => (
          <path key={d} d={d} />
        ))}
      </svg>
    </div>
  )
}
