'use client'

import { useState, useRef, useEffect } from 'react'
import { X } from 'lucide-react'
import {
  getScoreLevel,
  SCORE_THRESHOLDS,
} from '@/lib/config/thresholds'
import { getScoreColorClass, getScoreLabel } from '@/lib/utils/formatting'
import { SCORE_TOKENS } from '@/lib/config/ui-tokens'
import { SCORE_TYPE_LABELS, SCORE_LEVEL_EXPLANATIONS, SCORE_EXPLANATION_LABELS, COMPATIBILITY_SCORE_LABELS, MATCHING_LABELS, UI_LABELS } from '@/lib/constants/labels'

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
        className={`${sizeClasses[size].score} ${colorClass} cursor-pointer hover:underline decoration-dotted underline-offset-4 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 rounded`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        title={UI_LABELS.clickForDetails}
      >
        {score}% - {levelLabel}
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          role="dialog"
          aria-label={`${SCORE_TYPE_LABELS[type]} Erklärung`}
          className="absolute z-50 left-1/2 -translate-x-1/2 mt-2 w-80 bg-ui-elevated rounded-lg shadow-card-hover border border-ui-border p-4 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          {/* Arrow */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-ui-elevated border-l border-t border-ui-border rotate-45" />

          {/* Header */}
          <div className="flex items-start justify-between mb-3 relative">
            <div>
              <h3 className="font-semibold text-ui-text">
                {SCORE_TYPE_LABELS[type]}: {score}%
              </h3>
              <span className={`text-sm font-medium ${colorClass}`}>
                {levelLabel}
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="btn-icon"
              aria-label="Schliessen"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Description */}
          <p className="text-sm text-ui-muted mb-3">{explanation.description}</p>

          {/* Positive factors */}
          {positiveFactors.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-ui-muted mb-1">{MATCHING_LABELS.strengths}</p>
              <div className="space-y-1">
                {positiveFactors.map((factor, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-sm">
                    <span className="text-status-success-text flex-shrink-0">+</span>
                    <span className="text-ui-muted">
                      {factor.label}
                      {factor.detail && (
                        <span className="text-ui-muted ml-1">({factor.detail})</span>
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
              <p className="text-xs font-medium text-ui-muted mb-1">{MATCHING_LABELS.challenges}</p>
              <div className="space-y-1">
                {negativeFactors.map((factor, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-sm">
                    <span className="text-status-error-text flex-shrink-0">-</span>
                    <span className="text-ui-muted">
                      {factor.label}
                      {factor.detail && (
                        <span className="text-ui-muted ml-1">({factor.detail})</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendation */}
          <div className="pt-3 border-t border-ui-border">
            <p className="text-xs text-ui-muted mb-1">{SCORE_EXPLANATION_LABELS.recommendation}</p>
            <p className="text-sm text-ui-muted">{explanation.recommendation}</p>
          </div>

          {/* Threshold reference */}
          <div className="mt-3 pt-3 border-t border-ui-border">
            <p className="text-xs text-ui-muted">
              {SCORE_EXPLANATION_LABELS.scale} {'>='}{SCORE_THRESHOLDS.excellent} {COMPATIBILITY_SCORE_LABELS.excellent.toLowerCase()},{' '}
              {'>='}{SCORE_THRESHOLDS.good} {COMPATIBILITY_SCORE_LABELS.good.toLowerCase()}, {'>='}{SCORE_THRESHOLDS.moderate} {COMPATIBILITY_SCORE_LABELS.moderate.toLowerCase()}
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

  const hasFactors = factors.length > 0
  const positiveCount = factors.filter(f => f.impact === 'positive').length
  const negativeCount = factors.filter(f => f.impact === 'negative').length

  const tooltipContent = hasFactors
    ? `${positiveCount > 0 ? `+${positiveCount} ${MATCHING_LABELS.strengths}` : ''}${positiveCount > 0 && negativeCount > 0 ? ', ' : ''}${negativeCount > 0 ? `-${negativeCount} ${MATCHING_LABELS.challenges}` : ''}`
    : undefined

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-sm font-medium ${SCORE_TOKENS[level].soft} ${className}`}
      title={tooltipContent}
    >
      {score}%
      {hasFactors && (
        <span className="text-xs opacity-70">
          {positiveCount > 0 && <span className="text-status-success-text">+{positiveCount}</span>}
          {positiveCount > 0 && negativeCount > 0 && '/'}
          {negativeCount > 0 && <span className="text-status-error-text">-{negativeCount}</span>}
        </span>
      )}
    </span>
  )
}
