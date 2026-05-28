'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'

const PERIOD_OPTIONS = [
  { value: '7', label: '7 Tage' },
  { value: '30', label: '30 Tage' },
  { value: '60', label: '60 Tage' },
  { value: '90', label: '90 Tage' },
]

export function PeriodSelector({ currentDays }: { currentDays: number }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleChange = (days: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (days === '30') {
      params.delete('days')
    } else {
      params.set('days', days)
    }
    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  }

  return (
    <div className="flex gap-1 bg-ui-subtle rounded-lg p-1">
      {PERIOD_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => handleChange(opt.value)}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-aoz-primary focus-visible:ring-offset-1 ${
            String(currentDays) === opt.value
              ? 'bg-ui-surface text-ui-text shadow-card font-medium'
              : 'text-ui-muted hover:text-ui-muted'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
