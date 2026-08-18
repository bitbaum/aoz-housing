/* eslint-disable @next/next/no-img-element */
interface ProductImageProps {
  imageUrl: string
  name: string
  className?: string
}

/** Product visual: the stored image, or a branded placeholder until photos exist. */
export function ProductImage({ imageUrl, name, className = '' }: ProductImageProps) {
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
  return (
    <div
      className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-gold-50 via-neutral-100 to-gold-100 ${className}`}
      aria-label={name}
      role="img"
    >
      <span className="text-5xl" aria-hidden>
        👟
      </span>
    </div>
  )
}
