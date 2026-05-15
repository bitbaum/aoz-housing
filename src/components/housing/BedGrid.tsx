'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { SPOT_TYPE_ICONS } from '@/lib/config/placement-spots'
import {
  AGE_RANGE_LABELS,
  LANGUAGE_LABELS,
  UI_LABELS,
  getLabel,
} from '@/lib/constants'
import { DISPLAY_LIMITS } from '@/lib/config/thresholds'
import type { HousingSpot } from './types'

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
      return `bg-rose-100 border-rose-300 text-rose-700 ${isClickable ? 'hover:bg-rose-200 hover:border-rose-400 cursor-pointer' : ''}`
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
  onOccupiedBedClick,
  compact = false,
  showLabels = true,
}: BedGridProps) {
  const [selectedSpot, setSelectedSpot] = useState<HousingSpot | null>(null)
  const [popoverPosition, setPopoverPosition] = useState<{ x: number; y: number } | null>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setSelectedSpot(null)
      }
    }

    if (selectedSpot) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [selectedSpot])

  if (spots.length === 0) {
    return (
      <div className="text-sm text-gray-500 text-center py-2">
        Keine Plätze definiert
      </div>
    )
  }

  const gridSize = compact ? 'w-11 h-11' : 'w-11 h-11'
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
                ${isAvailableClickable || isOccupiedClickable ? 'hover:shadow-md focus-visible:ring-2 focus-visible:ring-aoz-primary focus-visible:ring-offset-1' : ''}
                ${isSelected ? 'ring-2 ring-aoz-primary ring-offset-1' : ''}
              `}
              aria-label={
                status === 'occupied' && activePlacement
                  ? `Platz ${spot.label || spot.code}: belegt von ${activePlacement.resident.code}`
                  : status === 'available'
                    ? `Platz ${spot.label || spot.code}: verfügbar`
                    : `Platz ${spot.label || spot.code}: nicht verfügbar`
              }
              title={
                status === 'occupied' && activePlacement
                  ? `${spot.label || spot.code}: ${activePlacement.resident.code} - Klicken für Details`
                  : status === 'available'
                    ? `${spot.label || spot.code}: Verfügbar - Klicken zum Platzieren`
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

interface ResidentBedPopoverProps {
  spot: HousingSpot
  position: { x: number; y: number }
  onClose: () => void
}

const ResidentBedPopover = ({
  spot,
  position,
  onClose,
}: ResidentBedPopoverProps & { ref?: React.Ref<HTMLDivElement> }) => {
  const popoverRef = useRef<HTMLDivElement>(null)
  const placement = getActivePlacement(spot)
  const resident = placement?.resident

  useEffect(() => {
    if (popoverRef.current) {
      const rect = popoverRef.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const padding = 8

      if (rect.right > viewportWidth) {
        popoverRef.current.style.left = `${viewportWidth - rect.width - padding}px`
      }
      if (rect.left < 0) {
        popoverRef.current.style.left = `${padding}px`
      }
      if (rect.bottom > viewportHeight) {
        popoverRef.current.style.top = `${position.y - rect.height - 60}px`
      }
    }
  }, [position])

  if (!resident) return null

  return (
    <div
      ref={popoverRef}
      className="fixed z-50 w-[calc(100vw-16px)] sm:w-64 bg-white rounded-xl shadow-card-hover border border-gray-100"
      style={{
        left: Math.max(8, position.x - 128),
        top: position.y,
      }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 bg-rose-50 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-aoz-primary text-white rounded-full flex items-center justify-center font-bold">
              {resident.code.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{resident.code}</p>
              <p className="text-xs text-gray-500">
                {spot.label || spot.code}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            aria-label={UI_LABELS.close}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-3 space-y-2">
        {resident.ageRange && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Alter</span>
            <span className="text-gray-900">{getLabel(AGE_RANGE_LABELS, resident.ageRange)}</span>
          </div>
        )}
        {resident.languages && resident.languages.length > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Sprachen</span>
            <span className="text-gray-900">
              {resident.languages.slice(0, DISPLAY_LIMITS.languagePreview).map((l) => getLabel(LANGUAGE_LABELS, l)).join(', ')}
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 rounded-b-lg">
        <Link
          href={`/residents/${resident.id}`}
          className="block w-full text-center text-sm text-aoz-primary hover:text-aoz-primary-dark font-medium"
          onClick={onClose}
        >
          Profil anzeigen →
        </Link>
      </div>
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
