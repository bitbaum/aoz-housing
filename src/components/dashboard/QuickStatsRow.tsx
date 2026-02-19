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
    green: 'border-green-200 bg-green-50 text-green-700',
    yellow: 'border-yellow-200 bg-yellow-50 text-yellow-700',
    red: 'border-red-200 bg-red-50 text-red-700',
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    gray: 'border-gray-200 bg-gray-50 text-gray-600',
  }

  const valueColorStyles = {
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
    blue: 'text-blue-600',
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
