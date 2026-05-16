'use client'

import { useEffect, forwardRef } from 'react'
import Link from 'next/link'
import { getScoreColorClass, getScoreLabel } from '@/lib/utils'
import { COMPATIBILITY_DIMENSION_LABELS, MATCHING_LABELS, COMPATIBILITY_MATRIX_LABELS, UI_LABELS } from '@/lib/constants'
import { SCORE_BG_COLORS, getScoreLevel } from '@/lib/config/thresholds'
import type { ResidentBasic } from '@/lib/types'

export interface CompatibilityScore {
  id: string
  residentId: string
  comparedWithId: string
  overallScore: number
  lifestyleScore?: number
  socialScore?: number
  practicalScore?: number
  riskScore?: number
  conflicts?: { message: string; severity: string }[]
  strengths?: string[]
}

export interface CompatibilityDetailPopoverProps {
  resident1: ResidentBasic
  resident2: ResidentBasic
  score: CompatibilityScore | null
  position: { x: number; y: number }
  onClose: () => void
}

export const CompatibilityDetailPopover = forwardRef<HTMLDivElement, CompatibilityDetailPopoverProps>(
  function CompatibilityDetailPopover({ resident1, resident2, score, position, onClose }, ref) {

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

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={`Kompatibilität: ${resident1.code} und ${resident2.code}`}
      className="fixed z-50 w-[calc(100vw-16px)] sm:w-80 bg-white rounded-xl shadow-card-hover border border-gray-100"
      style={{
        left: Math.max(8, position.x - 160),
        top: position.y,
      }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-aoz-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
              {resident1.code.slice(-3)}
            </div>
            <span className="text-gray-400">↔</span>
            <div className="w-8 h-8 bg-aoz-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
              {resident2.code.slice(-3)}
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
      <div className="p-4">
        {score ? (
          <>
            {/* Overall Score */}
            <div className="text-center mb-4">
              <span
                className={`text-3xl font-bold ${getScoreColorClass(score.overallScore)}`}
              >
                {score.overallScore}%
              </span>
              <p className="text-sm text-gray-500 mt-1">
                {getScoreLabel(score.overallScore)} {COMPATIBILITY_MATRIX_LABELS.compatibilitySuffix}
              </p>
            </div>

            {/* Dimension Scores */}
            <div className="space-y-2 mb-4">
              {score.lifestyleScore !== undefined && (
                <ScoreDimension
                  label={COMPATIBILITY_DIMENSION_LABELS.lifestyle.label}
                  score={score.lifestyleScore}
                  description={COMPATIBILITY_DIMENSION_LABELS.lifestyle.description}
                />
              )}
              {score.socialScore !== undefined && (
                <ScoreDimension
                  label={COMPATIBILITY_DIMENSION_LABELS.social.label}
                  score={score.socialScore}
                  description={COMPATIBILITY_DIMENSION_LABELS.social.description}
                />
              )}
              {score.practicalScore !== undefined && (
                <ScoreDimension
                  label={COMPATIBILITY_DIMENSION_LABELS.practical.label}
                  score={score.practicalScore}
                  description={COMPATIBILITY_DIMENSION_LABELS.practical.description}
                />
              )}
              {score.riskScore !== undefined && (
                <ScoreDimension
                  label={COMPATIBILITY_DIMENSION_LABELS.risk.label}
                  score={score.riskScore}
                  description={COMPATIBILITY_DIMENSION_LABELS.risk.description}
                />
              )}
            </div>

            {/* Strengths */}
            {score.strengths && score.strengths.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-500 mb-1">{MATCHING_LABELS.strengths}</p>
                <ul className="space-y-1">
                  {score.strengths.slice(0, 2).map((s, i) => (
                    <li key={i} className="text-sm text-green-600 flex items-start gap-1">
                      <span>✓</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Conflicts */}
            {score.conflicts && score.conflicts.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-500 mb-1">{MATCHING_LABELS.concerns}</p>
                <ul className="space-y-1">
                  {score.conflicts.slice(0, 2).map((c, i) => (
                    <li
                      key={i}
                      className={`text-sm flex items-start gap-1 ${
                        c.severity === 'BLOCKING'
                          ? 'text-red-600'
                          : c.severity === 'HIGH'
                          ? 'text-orange-600'
                          : 'text-yellow-600'
                      }`}
                    >
                      <span>⚠</span>
                      <span>{c.message}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-500 mb-2">{COMPATIBILITY_MATRIX_LABELS.noScore}</p>
            <p className="text-xs text-gray-500">
              {COMPATIBILITY_MATRIX_LABELS.noScoreDesc}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 rounded-b-lg flex gap-2">
        <Link
          href={`/residents/${resident1.id}`}
          className="flex-1 text-center inline-flex items-center justify-center min-h-[44px] text-sm text-aoz-primary hover:underline"
        >
          {resident1.code}
        </Link>
        <span className="text-gray-400">|</span>
        <Link
          href={`/residents/${resident2.id}`}
          className="flex-1 text-center inline-flex items-center justify-center min-h-[44px] text-sm text-aoz-primary hover:underline"
        >
          {resident2.code}
        </Link>
      </div>
    </div>
  )
})

function ScoreDimension({
  label,
  score,
  description,
}: {
  label: string
  score: number
  description: string
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-20">
        <p className="text-xs font-medium text-gray-700">{label}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full transition-all ${SCORE_BG_COLORS[getScoreLevel(score)]}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs font-medium w-8 text-right">{score}</span>
    </div>
  )
}
