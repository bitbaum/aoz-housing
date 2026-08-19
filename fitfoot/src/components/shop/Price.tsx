import { formatRappen } from '@/lib/money'

interface PriceProps {
  priceRappen: number
  compareAtRappen?: number | null
  size?: 'sm' | 'lg'
}

export function Price({ priceRappen, compareAtRappen, size = 'sm' }: PriceProps) {
  return (
    <span className="inline-flex items-baseline gap-2">
      <span className={size === 'lg' ? 'text-2xl font-bold' : 'font-semibold'}>
        {formatRappen(priceRappen)}
      </span>
      {compareAtRappen && compareAtRappen > priceRappen ? (
        <span className="text-sm text-muted line-through">{formatRappen(compareAtRappen)}</span>
      ) : null}
    </span>
  )
}
