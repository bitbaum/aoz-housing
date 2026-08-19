/* eslint-disable @next/next/no-img-element */
import { ProductArt } from './ProductArt'

interface ProductImageProps {
  imageUrl: string
  name: string
  category: string
  className?: string
}

/** Product visual: the stored photo, or an art-directed placeholder until one exists. */
export function ProductImage({ imageUrl, name, category, className = '' }: ProductImageProps) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className={`h-full w-full object-cover ${className}`}
        loading="lazy"
      />
    )
  }
  return <ProductArt category={category} className={className} />
}
