import Link from 'next/link'
import { APP_LABELS } from '@/lib/constants/labels'
import { BRAND } from '@/lib/config/brand'

type LogoSize = 'sm' | 'md' | 'lg' | 'xl'

interface LogoProps {
  size?: LogoSize
  showTagline?: boolean
  href?: string
  className?: string
}

const sizeConfig: Record<LogoSize, { mark: string; label: string; tagline: string }> = {
  sm: { mark: 'text-lg', label: 'text-sm', tagline: 'text-xs' },
  md: { mark: 'text-xl', label: 'text-base', tagline: 'text-xs' },
  lg: { mark: 'text-2xl', label: 'text-lg', tagline: 'text-sm' },
  xl: { mark: 'text-4xl', label: 'text-2xl', tagline: 'text-base' },
}

function LogoMark({ size = 'md', showTagline = false, className = '' }: Omit<LogoProps, 'href'>) {
  const s = sizeConfig[size]
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <span className={`text-brand-primary font-bold ${s.mark} tracking-tight`}>{BRAND.shortName}</span>
      <span className={`text-ui-text font-semibold ${s.label}`}>Wohnen</span>
      {showTagline && (
        <span className={`hidden lg:inline text-ui-muted ml-1.5 ${s.tagline}`}>
          {APP_LABELS.tagline}
        </span>
      )}
    </div>
  )
}

export function Logo({ size = 'md', showTagline = false, href, className = '' }: LogoProps) {
  if (href) {
    return (
      <Link href={href} className={`hover:opacity-90 transition-opacity ${className}`}>
        <LogoMark size={size} showTagline={showTagline} />
      </Link>
    )
  }
  return <LogoMark size={size} showTagline={showTagline} className={className} />
}
