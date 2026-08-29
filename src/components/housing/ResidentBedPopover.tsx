'use client'

import { useEffect, forwardRef } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'
import { AGE_RANGE_LABELS, LANGUAGE_LABELS, BED_GRID_LABELS, getLabel } from '@/lib/constants'
import { DISPLAY_LIMITS } from '@/lib/config/thresholds'
import type { HousingSpot } from './types'
import { residentInitials, residentName } from '@/lib/utils/resident-name'

export function getActivePlacement(spot: HousingSpot) {
  return spot.placements.find((p) => p.status === 'ACTIVE')
}

export interface ResidentBedPopoverProps {
  spot: HousingSpot
  position: { x: number; y: number }
  onClose: () => void
}

export const ResidentBedPopover = forwardRef<HTMLDivElement, ResidentBedPopoverProps>(
  function ResidentBedPopover({ spot, position, onClose }, ref) {
    const placement = getActivePlacement(spot)
    const resident = placement?.resident

    useEffect(() => {
      const el = (ref as React.RefObject<HTMLDivElement>)?.current
      if (el) {
        const rect = el.getBoundingClientRect()
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight
        const padding = 8

        if (rect.right > viewportWidth) {
          el.style.left = `${viewportWidth - rect.width - padding}px`
        }
        if (rect.left < 0) {
          el.style.left = `${padding}px`
        }
        if (rect.bottom > viewportHeight) {
          el.style.top = `${position.y - rect.height - 60}px`
        }
      }
    }, [position, ref])

    if (!resident) return null

    return (
      <div
        ref={ref}
        className="fixed z-50 w-[calc(100vw-16px)] sm:w-64 overlay-panel"
        style={{
          left: Math.max(8, position.x - 128),
          top: position.y,
        }}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-ui-border bg-brand-primary/8 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="avatar font-bold">{residentInitials(resident)}</div>
              <div>
                <p className="font-semibold text-ui-text">{residentName(resident)}</p>
                <p className="text-xs text-ui-muted">{spot.label || spot.code}</p>
              </div>
            </div>
            <button onClick={onClose} className="btn-icon" aria-label="Schliessen">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 py-3 space-y-2">
          {resident.ageRange && (
            <div className="flex justify-between text-sm">
              <span className="text-ui-muted">{BED_GRID_LABELS.age}</span>
              <span className="text-ui-text">{getLabel(AGE_RANGE_LABELS, resident.ageRange)}</span>
            </div>
          )}
          {resident.languages && resident.languages.length > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-ui-muted">{BED_GRID_LABELS.languages}</span>
              <span className="text-ui-text">
                {resident.languages
                  .slice(0, DISPLAY_LIMITS.languagePreview)
                  .map((l) => getLabel(LANGUAGE_LABELS, l))
                  .join(', ')}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-ui-border bg-ui-subtle rounded-b-lg">
          <Link
            href={`/residents/${resident.id}`}
            className="block w-full text-center text-sm text-brand-primary hover:text-brand-primary-dark font-medium"
            onClick={onClose}
          >
            {BED_GRID_LABELS.showProfile}
          </Link>
        </div>
      </div>
    )
  },
)
