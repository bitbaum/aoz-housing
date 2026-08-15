'use client'

import { useState, useRef, useEffect } from 'react'
import { SPOT_TYPE_ICONS } from '@/lib/config/placement-spots'
import { BED_GRID_LABELS } from '@/lib/constants'
import type { HousingSpot } from './types'
import { getActivePlacement, ResidentBedPopover } from './ResidentBedPopover'
import { residentInitials, residentName } from '@/lib/utils/resident-name'

interface BedGridProps {
  spots: HousingSpot[]
  onBedClick?: (spot: HousingSpot) => void
  onOccupiedBedClick?: (spot: HousingSpot) => void
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

function getBedColorClasses(status: BedStatus, isClickable: boolean): string {
  switch (status) {
    case 'occupied':
      return `bg-brand-primary/10 border-brand-primary/30 text-brand-primary ${isClickable ? 'hover:bg-brand-primary/15 hover:border-brand-primary/50 cursor-pointer' : ''}`
    case 'available':
      return 'bg-status-success/15 border-status-success/40 text-status-success-text hover:bg-status-success/20 cursor-pointer'
    case 'unavailable':
      return 'bg-ui-subtle border-ui-border-strong text-ui-muted'
  }
}

export function BedGrid({
  spots,
  onBedClick,
  onOccupiedBedClick,
  compact = false,
  showLabels = true,
}: BedGridProps) {
  const [selectedSpot, setSelectedSpot] = useState<HousingSpot | null>(null)
  const [popoverPosition, setPopoverPosition] = useState<{ x: number; y: number } | null>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setSelectedSpot(null)
      }
    }

    if (selectedSpot) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        document.removeEventListener('touchstart', handleClickOutside)
      }
    }
  }, [selectedSpot])

  if (spots.length === 0) {
    return (
      <div className="text-sm text-ui-muted text-center py-2">
        {BED_GRID_LABELS.noSpots}
      </div>
    )
  }

  const gridSize = 'w-11 h-11'
  const fontSize = compact ? 'text-xs' : 'text-sm'
  const iconSize = compact ? 'text-sm' : 'text-base'

  const handleBedClick = (spot: HousingSpot, event: React.MouseEvent) => {
    const status = getBedStatus(spot)

    if (status === 'available' && onBedClick) {
      onBedClick(spot)
    } else if (status === 'occupied') {
      // Show popover with resident info
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
      setPopoverPosition({
        x: rect.left + rect.width / 2,
        y: rect.bottom + 8,
      })
      setSelectedSpot(spot)

      if (onOccupiedBedClick) {
        onOccupiedBedClick(spot)
      }
    }
  }

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-2">
        {spots.map((spot) => {
          const status = getBedStatus(spot)
          const activePlacement = getActivePlacement(spot)
          const isAvailableClickable = status === 'available' && onBedClick
          const isOccupiedClickable = status === 'occupied'
          const isSelected = selectedSpot?.id === spot.id

          return (
            <div
              key={spot.id}
              onClick={(e) => handleBedClick(spot, e)}
              role={isAvailableClickable || isOccupiedClickable ? 'button' : undefined}
              tabIndex={isAvailableClickable || isOccupiedClickable ? 0 : undefined}
              onKeyDown={isAvailableClickable || isOccupiedClickable ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleBedClick(spot, e as unknown as React.MouseEvent)
                }
              } : undefined}
              className={`
                ${gridSize}
                border-2 rounded-md
                flex flex-col items-center justify-center
                transition-all
                ${getBedColorClasses(status, isOccupiedClickable)}
                ${isAvailableClickable || isOccupiedClickable ? 'hover:border-ui-border-strong focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1' : ''}
                ${isSelected ? 'ring-2 ring-brand-primary ring-offset-1' : ''}
              `}
              aria-label={
                status === 'occupied' && activePlacement
                  ? BED_GRID_LABELS.ariaOccupied(spot.label || spot.code, activePlacement.resident.code)
                  : status === 'available'
                    ? BED_GRID_LABELS.ariaAvailable(spot.label || spot.code)
                    : BED_GRID_LABELS.ariaUnavailable(spot.label || spot.code)
              }
              title={
                status === 'occupied' && activePlacement
                  ? BED_GRID_LABELS.titleOccupied(spot.label || spot.code, activePlacement.resident.code)
                  : status === 'available'
                    ? BED_GRID_LABELS.titleAvailable(spot.label || spot.code)
                    : BED_GRID_LABELS.titleUnavailable(spot.label || spot.code)
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
                      {residentInitials(activePlacement.resident)}
                    </span>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* Resident Popover */}
      {selectedSpot && popoverPosition && (
        <ResidentBedPopover
          ref={popoverRef}
          spot={selectedSpot}
          position={popoverPosition}
          onClose={() => setSelectedSpot(null)}
        />
      )}
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
                  ? 'bg-brand-primary'
                  : status === 'available'
                    ? 'bg-status-success'
                    : 'bg-ui-border-strong'
              }`}
            />
          )
        })}
        {total > 8 && (
          <span className={`${fontSize} text-ui-muted ml-1`}>+{total - 8}</span>
        )}
      </div>
      <span className={`${fontSize} text-ui-muted`}>
        {available} {BED_GRID_LABELS.freeSuffix}
      </span>
    </div>
  )
}

export default BedGrid
