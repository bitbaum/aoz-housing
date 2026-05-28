import Link from 'next/link'
import type { ReactNode } from 'react'

// =============================================================================
// QuickStat
// =============================================================================

export interface QuickStatProps {
  label: string
  value: number
  total?: number
  suffix?: string
  subtext?: string
  href: string
  color: 'green' | 'yellow' | 'red' | 'blue' | 'gray'
  icon: ReactNode
}

export function QuickStat({ label, value, total, suffix, subtext, href, color, icon }: QuickStatProps) {
  const colorStyles = {
    green: 'border-status-success/25 bg-status-success/10 text-status-success-text',
    yellow: 'border-status-warning/25 bg-status-warning/10 text-status-warning-text',
    red: 'border-status-error/25 bg-status-error/8 text-status-error-text',
    blue: 'border-status-info/25 bg-status-info/8 text-status-info-text',
    gray: 'border-ui-border bg-ui-subtle text-ui-muted',
  }

  const valueColorStyles = {
    green: 'text-status-success',
    yellow: 'text-status-warning',
    red: 'text-status-error',
    blue: 'text-status-info',
    gray: 'text-ui-muted',
  }

  return (
    <Link
      href={href}
      className={`block p-4 rounded-lg border-2 ${colorStyles[color]} hover:shadow-card-hover transition-all`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xl inline-flex items-center">{icon}</span>
        <span className={`text-2xl font-bold ${valueColorStyles[color]}`}>
          {value}{suffix}
        </span>
      </div>
      <div className="text-sm font-medium">{label}</div>
      {subtext && (
        <div className="text-xs opacity-70 mt-0.5">{subtext}</div>
      )}
      {total !== undefined && (
        <div className="mt-2 h-1.5 bg-ui-surface/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-current rounded-full transition-all"
            style={{ width: `${(value / total) * 100}%` }}
          />
        </div>
      )}
    </Link>
  )
}
