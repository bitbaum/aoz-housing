import Link from 'next/link'

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
  icon: string
}

export function QuickStat({ label, value, total, suffix, subtext, href, color, icon }: QuickStatProps) {
  const colorStyles = {
    green: 'border-status-success/25 bg-status-success/10 text-green-700',
    yellow: 'border-status-warning/25 bg-status-warning/10 text-amber-700',
    red: 'border-status-error/25 bg-status-error/8 text-red-700',
    blue: 'border-status-info/25 bg-status-info/8 text-blue-700',
    gray: 'border-gray-200 bg-gray-50 text-gray-600',
  }

  const valueColorStyles = {
    green: 'text-status-success',
    yellow: 'text-status-warning',
    red: 'text-status-error',
    blue: 'text-status-info',
    gray: 'text-gray-500',
  }

  return (
    <Link
      href={href}
      className={`block p-4 rounded-xl border-2 ${colorStyles[color]} hover:shadow-md transition-all`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xl">{icon}</span>
        <span className={`text-2xl font-bold ${valueColorStyles[color]}`}>
          {value}{suffix}
        </span>
      </div>
      <div className="text-sm font-medium">{label}</div>
      {subtext && (
        <div className="text-xs opacity-70 mt-0.5">{subtext}</div>
      )}
      {total !== undefined && (
        <div className="mt-2 h-1.5 bg-white/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-current rounded-full transition-all"
            style={{ width: `${(value / total) * 100}%` }}
          />
        </div>
      )}
    </Link>
  )
}
