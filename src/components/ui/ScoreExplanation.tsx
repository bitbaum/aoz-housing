'use client'

import { useState, useRef, useEffect } from 'react'
import {
  getScoreLevel,
  SCORE_THRESHOLDS,
  type ScoreLevel,
} from '@/lib/config/thresholds'
import { getScoreColorClass, getScoreLabel } from '@/lib/utils/formatting'
import { SCORE_TYPE_LABELS, SCORE_LEVEL_EXPLANATIONS } from '@/lib/constants/labels'

/**
 * Factor impacting a score
 */
export interface ScoreFactor {
  label: string
  impact: 'positive' | 'negative' | 'neutral'
  /** Optional detail about the factor */
  detail?: string
}

interface ScoreExplanationProps {
  /** The numeric score (0-100) */
  score: number
  /** Type of score for contextual labeling */
  type?: 'compatibility' | 'fit' | 'harmony'
  /** Show detailed breakdown */
  showDetails?: boolean
  /** Factors contributing to the score */
  factors?: ScoreFactor[]
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Optional className */
  className?: string
}

const sizeClasses = {
  sm: { score: 'text-sm', label: 'text-xs' },
  md: { score: 'text-lg font-bold', label: 'text-sm' },
  lg: { score: 'text-2xl font-bold', label: 'text-base' },
}

export function ScoreExplanation({
  score,
  type = 'compatibility',
  showDetails = true,
  factors = [],
  size = 'md',
  className = '',
}: ScoreExplanationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const level = getScoreLevel(score)
  const colorClass = getScoreColorClass(score)
  const levelLabel = getScoreLabel(score)
  const explanation = SCORE_LEVEL_EXPLANATIONS[level]

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return

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

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  const positiveFactors = factors.filter(f => f.impact === 'positive')
  const negativeFactors = factors.filter(f => f.impact === 'negative')

  if (!showDetails) {
    // Simple inline display
    return (
      <span className={`${colorClass} ${sizeClasses[size].score} ${className}`}>
        {score}% - {levelLabel}
      </span>
    )
  }

  return (
    <span className={`relative inline-block ${className}`}>
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`${sizeClasses[size].score} ${colorClass} cursor-pointer hover:underline decoration-dotted underline-offset-4 focus:outline-none focus:ring-2 focus:ring-aoz-primary focus:ring-offset-2 rounded`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        title="Klicken für Details"
      >
        {score}% - {levelLabel}
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          role="dialog"
          aria-label={`${SCORE_TYPE_LABELS[type]} Erklärung`}
          className="absolute z-50 left-1/2 -translate-x-1/2 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 p-4 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          {/* Arrow */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-l border-t border-gray-200 rotate-45" />

          {/* Header */}
          <div className="flex items-start justify-between mb-3 relative">
            <div>
              <h3 className="font-semibold text-gray-900">
                {SCORE_TYPE_LABELS[type]}: {score}%
              </h3>
              <span className={`text-sm font-medium ${colorClass}`}>
                {levelLabel}
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 -mt-1 -mr-1 p-1"
              aria-label="Schliessen"
            >
              ×
            </button>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 mb-3">{explanation.description}</p>

          {/* Positive factors */}
          {positiveFactors.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-gray-500 mb-1">Stärken</p>
              <div className="space-y-1">
                {positiveFactors.map((factor, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-sm">
                    <span className="text-green-600 flex-shrink-0">+</span>
                    <span className="text-gray-700">
                      {factor.label}
                      {factor.detail && (
                        <span className="text-gray-400 ml-1">({factor.detail})</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Negative factors */}
          {negativeFactors.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-gray-500 mb-1">Herausforderungen</p>
              <div className="space-y-1">
                {negativeFactors.map((factor, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-sm">
                    <span className="text-red-600 flex-shrink-0">-</span>
                    <span className="text-gray-700">
                      {factor.label}
                      {factor.detail && (
                        <span className="text-gray-400 ml-1">({factor.detail})</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendation */}
          <div className="pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Empfehlung</p>
            <p className="text-sm text-gray-700">{explanation.recommendation}</p>
          </div>

          {/* Threshold reference */}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Bewertungsskala: {'>='}{SCORE_THRESHOLDS.excellent} ausgezeichnet,{' '}
              {'>='}{SCORE_THRESHOLDS.good} gut, {'>='}{SCORE_THRESHOLDS.moderate} mittel
            </p>
          </div>
        </div>
      )}
    </span>
  )
}

/**
 * Compact score badge with optional explanation tooltip
 */
interface ScoreExplanationBadgeProps {
  score: number
  factors?: ScoreFactor[]
  className?: string
}

export function ScoreExplanationBadge({
  score,
  factors = [],
  className = '',
}: ScoreExplanationBadgeProps) {
  const level = getScoreLevel(score)
  const colorClass = getScoreColorClass(score)

  const bgClasses: Record<ScoreLevel, string> = {
    excellent: 'bg-green-100',
    good: 'bg-emerald-100',
    moderate: 'bg-yellow-100',
    low: 'bg-orange-100',
    critical: 'bg-red-100',
  }

  const hasFactors = factors.length > 0
  const positiveCount = factors.filter(f => f.impact === 'positive').length
  const negativeCount = factors.filter(f => f.impact === 'negative').length

  const tooltipContent = hasFactors
    ? `${positiveCount > 0 ? `+${positiveCount} Stärken` : ''}${positiveCount > 0 && negativeCount > 0 ? ', ' : ''}${negativeCount > 0 ? `-${negativeCount} Herausforderungen` : ''}`
    : undefined

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${bgClasses[level]} ${colorClass} ${className}`}
      title={tooltipContent}
    >
      {score}%
      {hasFactors && (
        <span className="text-xs opacity-70">
          {positiveCount > 0 && <span className="text-green-600">+{positiveCount}</span>}
          {positiveCount > 0 && negativeCount > 0 && '/'}
          {negativeCount > 0 && <span className="text-red-600">-{negativeCount}</span>}
        </span>
      )}
    </span>
  )
}
