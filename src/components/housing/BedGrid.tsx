'use client'

import { SPOT_TYPE_ICONS } from '@/lib/config/placement-spots'
import type { HousingSpot } from './types'

interface BedGridProps {
  spots: HousingSpot[]
  onBedClick?: (spot: HousingSpot) => void
  compact?: boolean
  showLabels?: boolean
}

type BedStatus = 'occupied' | 'available' | 'unavailable'

function getBedStatus(spot: HousingSpot): BedStatus {
  const hasActivePlacement = spot.placements.some((p) => p.status === 'ACTIVE')
  if (hasActivePlacement) return 'occupied'
  if (spot.status === 'AVAILABLE') return 'available'
  return 'unavailable'
}

function getBedColorClasses(status: BedStatus): string {
  switch (status) {
    case 'occupied':
      return 'bg-rose-100 border-rose-300 text-rose-700'
    case 'available':
      return 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200 cursor-pointer'
    case 'unavailable':
      return 'bg-gray-100 border-gray-300 text-gray-400'
  }
}

function getActivePlacement(spot: HousingSpot) {
  return spot.placements.find((p) => p.status === 'ACTIVE')
}

export function BedGrid({
  spots,
  onBedClick,
  compact = false,
  showLabels = true,
}: BedGridProps) {
  if (spots.length === 0) {
    return (
      <div className="text-sm text-gray-500 text-center py-2">
        Keine Plätze definiert
      </div>
    )
  }

  const gridSize = compact ? 'w-8 h-8' : 'w-10 h-10'
  const fontSize = compact ? 'text-xs' : 'text-sm'
  const iconSize = compact ? 'text-sm' : 'text-base'

  return (
    <div className="flex flex-wrap gap-2">
      {spots.map((spot) => {
        const status = getBedStatus(spot)
        const activePlacement = getActivePlacement(spot)
        const isClickable = status === 'available' && onBedClick

        return (
          <div
            key={spot.id}
            onClick={() => isClickable && onBedClick(spot)}
            className={`
              ${gridSize}
              border-2 rounded-md
              flex flex-col items-center justify-center
              transition-colors
              ${getBedColorClasses(status)}
              ${isClickable ? 'hover:shadow-md' : ''}
            `}
            title={
              status === 'occupied' && activePlacement
                ? `${spot.label || spot.code}: ${activePlacement.resident.code}`
                : status === 'available'
                  ? `${spot.label || spot.code}: Verfügbar`
                  : `${spot.label || spot.code}: Nicht verfügbar`
            }
          >
            {compact ? (
              // Compact mode: just the icon
              <span className={iconSize}>{SPOT_TYPE_ICONS[spot.type]}</span>
            ) : (
              // Full mode: icon + status indicator
              <>
                <span className={iconSize}>{SPOT_TYPE_ICONS[spot.type]}</span>
                {showLabels && status === 'occupied' && activePlacement && (
                  <span className={`${fontSize} font-medium truncate max-w-full px-0.5`}>
                    {activePlacement.resident.code.slice(0, 3)}
                  </span>
                )}
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}

interface BedGridSummaryProps {
  occupied: number
  available: number
  unavailable?: number
  compact?: boolean
}

export function BedGridSummary({
  occupied,
  available,
  unavailable = 0,
  compact = false,
}: BedGridSummaryProps) {
  const total = occupied + available + unavailable
  if (total === 0) return null

  const dotSize = compact ? 'w-3 h-3' : 'w-4 h-4'
  const fontSize = compact ? 'text-xs' : 'text-sm'

  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1">
        {/* Render dots for each bed, max 8 visible */}
        {Array.from({ length: Math.min(total, 8) }).map((_, i) => {
          let status: BedStatus
          if (i < occupied) status = 'occupied'
          else if (i < occupied + available) status = 'available'
          else status = 'unavailable'

          return (
            <div
              key={i}
              className={`${dotSize} rounded-sm ${
                status === 'occupied'
                  ? 'bg-rose-400'
                  : status === 'available'
                    ? 'bg-emerald-400'
                    : 'bg-gray-300'
              }`}
            />
          )
        })}
        {total > 8 && (
          <span className={`${fontSize} text-gray-500 ml-1`}>+{total - 8}</span>
        )}
      </div>
      <span className={`${fontSize} text-gray-600`}>
        {available} frei
      </span>
    </div>
  )
}

export default BedGrid
