import Link from 'next/link'
import { APP_LABELS } from '@/lib/constants/labels'
import { BRAND } from '@/lib/config/brand'

/**
 * The wordmark. Set as one tightly-tracked unit — the acronym carries the
 * brand colour, the product word stays neutral — so it reads as a mark rather
 * than as two words that happen to sit together.
 *
 * The acronym itself is never hardcoded: it comes from the brand SSOT, so
 * re-badging the product re-badges the logo. @see lib/config/brand.ts
 */

type LogoSize = 'sm' | 'md' | 'lg' | 'xl'

interface LogoProps {
  size?: LogoSize
  showTagline?: boolean
  href?: string
  className?: string
}

const sizeConfig: Record<LogoSize, { mark: string; tagline: string }> = {
  sm: { mark: 'text-sm', tagline: 'text-2xs' },
  md: { mark: 'text-base', tagline: 'text-2xs' },
  lg: { mark: 'text-xl', tagline: 'text-xs' },
  xl: { mark: 'text-3xl', tagline: 'text-sm' },
}

function LogoMark({ size = 'md', showTagline = false, className = '' }: Omit<LogoProps, 'href'>) {
  const s = sizeConfig[size]
  return (
    <div className={`flex items-baseline gap-2 ${className}`}>
      <span className={`font-semibold tracking-tight ${s.mark}`}>
        <span className="text-brand-primary">{BRAND.shortName}</span>
        <span className="text-ui-text"> Wohnen</span>
      </span>
      {showTagline && (
        <span className={`hidden lg:inline eyebrow ${s.tagline}`}>{APP_LABELS.tagline}</span>
      )}
    </div>
  )
}

export function Logo({ size = 'md', showTagline = false, href, className = '' }: LogoProps) {
  if (href) {
    return (
      <Link
        href={href}
        className={`inline-flex transition-opacity hover:opacity-70 ${className}`}
        aria-label={APP_LABELS.name}
      >
        <LogoMark size={size} showTagline={showTagline} />
      </Link>
    )
  }
  return <LogoMark size={size} showTagline={showTagline} className={className} />
}
