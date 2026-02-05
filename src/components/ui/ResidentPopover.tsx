'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import {
  AGE_RANGE_LABELS,
  LANGUAGE_LABELS,
  SOCIAL_STYLE_LABELS,
  SLEEP_SCHEDULE_LABELS,
  SMOKING_STATUS_LABELS,
  getLabel,
} from '@/lib/constants'

interface ResidentData {
  id: string
  code: string
  ageRange?: string
  gender?: string
  languages?: string[]
  socialStyle?: string
  sleepSchedule?: string
  smokingStatus?: string
  noiseTolerance?: number
  cleanlinessLevel?: number
  privacyNeed?: number
}

interface ResidentPopoverProps {
  resident: ResidentData
  trigger: React.ReactNode
  placement?: 'top' | 'bottom' | 'left' | 'right'
}

export function ResidentPopover({
  resident,
  trigger,
  placement = 'bottom',
}: ResidentPopoverProps) {
  const [isOpen, setIsOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const placementClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  return (
    <div className="relative inline-block">
      <div
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer"
      >
        {trigger}
      </div>

      {isOpen && (
        <div
          ref={popoverRef}
          className={`absolute z-50 w-72 bg-white rounded-lg shadow-lg border border-gray-200 ${placementClasses[placement]}`}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-aoz-primary text-white rounded-full flex items-center justify-center font-bold">
                {resident.code.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{resident.code}</p>
                <p className="text-sm text-gray-500">
                  {getLabel(AGE_RANGE_LABELS, resident.ageRange || '')}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-4 py-3 space-y-3">
            {/* Languages */}
            {resident.languages && resident.languages.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Sprachen</p>
                <div className="flex flex-wrap gap-1">
                  {resident.languages.slice(0, 4).map((lang) => (
                    <span
                      key={lang}
                      className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded"
                    >
                      {getLabel(LANGUAGE_LABELS, lang)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              {resident.socialStyle && (
                <div>
                  <p className="text-xs text-gray-500">Sozial</p>
                  <p className="text-gray-900">
                    {getLabel(SOCIAL_STYLE_LABELS, resident.socialStyle)}
                  </p>
                </div>
              )}
              {resident.sleepSchedule && (
                <div>
                  <p className="text-xs text-gray-500">Schlaf</p>
                  <p className="text-gray-900">
                    {getLabel(SLEEP_SCHEDULE_LABELS, resident.sleepSchedule)}
                  </p>
                </div>
              )}
              {resident.smokingStatus && (
                <div>
                  <p className="text-xs text-gray-500">Rauchen</p>
                  <p className="text-gray-900">
                    {getLabel(SMOKING_STATUS_LABELS, resident.smokingStatus)}
                  </p>
                </div>
              )}
            </div>

            {/* Scale indicators */}
            {(resident.noiseTolerance || resident.cleanlinessLevel || resident.privacyNeed) && (
              <div className="space-y-2">
                {resident.noiseTolerance && (
                  <ScaleBar label="Lärmtoleranz" value={resident.noiseTolerance} />
                )}
                {resident.cleanlinessLevel && (
                  <ScaleBar label="Sauberkeit" value={resident.cleanlinessLevel} />
                )}
                {resident.privacyNeed && (
                  <ScaleBar label="Privatsphäre" value={resident.privacyNeed} />
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 rounded-b-lg">
            <Link
              href={`/residents/${resident.id}`}
              className="block w-full text-center text-sm text-aoz-primary hover:text-aoz-primary-dark font-medium"
              onClick={() => setIsOpen(false)}
            >
              Vollständiges Profil anzeigen →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

function ScaleBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 w-20">{label}</span>
      <div className="flex-1 flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-sm ${
              i <= value ? 'bg-aoz-primary' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

export default ResidentPopover
