import Link from 'next/link'
import { APP_LABELS } from '@/lib/constants/labels'

type LogoSize = 'sm' | 'md' | 'lg' | 'xl'

interface LogoProps {
  size?: LogoSize
  showTagline?: boolean
  href?: string
  className?: string
}

const sizeConfig: Record<LogoSize, { aoz: string; label: string; tagline: string }> = {
  sm: { aoz: 'text-lg', label: 'text-sm', tagline: 'text-xs' },
  md: { aoz: 'text-xl', label: 'text-base', tagline: 'text-xs' },
  lg: { aoz: 'text-2xl', label: 'text-lg', tagline: 'text-sm' },
  xl: { aoz: 'text-4xl', label: 'text-2xl', tagline: 'text-base' },
}

function LogoMark({ size = 'md', showTagline = false, className = '' }: Omit<LogoProps, 'href'>) {
  const s = sizeConfig[size]
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <span className={`text-aoz-primary font-bold ${s.aoz} tracking-tight`}>AOZ</span>
      <span className={`text-aoz-secondary font-semibold ${s.label}`}>Wohnen</span>
      {showTagline && (
        <span className={`hidden lg:inline text-gray-400 ml-1.5 ${s.tagline}`}>
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
