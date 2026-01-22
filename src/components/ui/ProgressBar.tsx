/**
 * Progress bar components
 */

import { getOccupancyColorClass } from '@/lib/utils/formatting'

interface ProgressBarProps {
  value: number
  max: number
  colorClass?: string
  height?: 'sm' | 'md' | 'lg'
}

export function ProgressBar({ value, max, colorClass, height = 'sm' }: ProgressBarProps) {
  const percent = max > 0 ? Math.round((value / max) * 100) : 0
  const color = colorClass || getOccupancyColorClass(percent)

  const heightClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  }

  return (
    <div className={`${heightClasses[height]} bg-gray-200 rounded-full overflow-hidden`}>
      <div
        className={`h-full ${color} transition-all duration-300`}
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}

interface OccupancyBarProps {
  current: number
  total: number
  showLabel?: boolean
}

export function OccupancyBar({ current, total, showLabel = true }: OccupancyBarProps) {
  const percent = total > 0 ? Math.round((current / total) * 100) : 0

  return (
    <div>
      {showLabel && (
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-500">Belegung</span>
          <span className="font-medium">{current}/{total}</span>
        </div>
      )}
      <ProgressBar value={current} max={total} />
    </div>
  )
}
