'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'
import { EXPLAINABLE_NUMBER_LABELS } from '@/lib/constants/labels'

export interface NumberExplanation {
  label: string
  source: 'database' | 'calculation' | 'derived'
  sourceDescription: string
  formula?: string
  interpretation?: string
  dataPoints?: { label: string; value: string | number }[]
}

interface ExplainableNumberProps {
  value: string | number
  explanation: NumberExplanation
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg font-semibold',
  xl: 'text-3xl font-bold',
}

export function ExplainableNumber({
  value,
  explanation,
  className = '',
  size = 'md',
}: ExplainableNumberProps) {
  const [isOpen, setIsOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

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

  const sourceIcon = {
    database: '🗃️',
    calculation: '🧮',
    derived: '📊',
  }[explanation.source]

  const sourceLabel = EXPLAINABLE_NUMBER_LABELS.sources[explanation.source]

  return (
    <span className="relative inline-block">
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`${sizeClasses[size]} ${className} cursor-pointer hover:underline decoration-dotted underline-offset-4 decoration-ui-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 rounded`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        {value}
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          role="dialog"
          aria-label={`${EXPLAINABLE_NUMBER_LABELS.explanationFor} ${explanation.label}`}
          className="absolute z-50 left-1/2 -translate-x-1/2 mt-2 w-80 bg-ui-elevated rounded-lg shadow-card-hover border border-ui-border p-4 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          {/* Arrow */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-ui-elevated border-l border-t border-ui-border rotate-45" />

          {/* Header */}
          <div className="flex items-start justify-between mb-3 relative">
            <div>
              <h3 className="font-semibold text-ui-text">{explanation.label}</h3>
              <div className="flex items-center gap-1 text-xs text-ui-muted mt-0.5">
                <span>{sourceIcon}</span>
                <span>{sourceLabel}</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="btn-icon"
              aria-label="Schliessen"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Source description */}
          <div className="mb-3">
            <p className="text-sm text-ui-muted">{explanation.sourceDescription}</p>
          </div>

          {/* Formula (if calculation) */}
          {explanation.formula && (
            <div className="mb-3 p-2 bg-ui-subtle rounded border border-ui-border">
              <p className="text-xs text-ui-muted mb-1">{EXPLAINABLE_NUMBER_LABELS.formula}</p>
              <code className="text-sm text-ui-text font-mono">{explanation.formula}</code>
            </div>
          )}

          {/* Data points */}
          {explanation.dataPoints && explanation.dataPoints.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-ui-muted mb-2">{EXPLAINABLE_NUMBER_LABELS.dataPoints}</p>
              <div className="space-y-1">
                {explanation.dataPoints.map((point, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-ui-muted">{point.label}</span>
                    <span className="font-medium text-ui-text">{point.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interpretation */}
          {explanation.interpretation && (
            <div className="pt-3 border-t border-ui-border">
              <p className="text-xs text-ui-muted mb-1">{EXPLAINABLE_NUMBER_LABELS.interpretation}</p>
              <p className="text-sm text-ui-muted">{explanation.interpretation}</p>
            </div>
          )}
        </div>
      )}
    </span>
  )
}

/**
 * Wrapper for metric cards that makes the value explainable
 */
interface ExplainableMetricProps {
  title: string
  value: string | number
  subtitle: string
  explanation: NumberExplanation
  trend?: 'good' | 'neutral' | 'warning'
  href?: string
}

export function ExplainableMetric({
  title,
  value,
  subtitle,
  explanation,
  trend = 'neutral',
  href,
}: ExplainableMetricProps) {
  const trendClasses = {
    good: 'text-status-success-text',
    neutral: 'text-ui-muted',
    warning: 'text-status-warning-text',
  }

  const Content = (
    <div className="card-hover">
      <p className="text-sm text-ui-muted">{title}</p>
      <div className="mt-1">
        <ExplainableNumber
          value={value}
          explanation={explanation}
          size="xl"
          className="text-ui-text"
        />
      </div>
      <p className={`text-sm mt-2 ${trendClasses[trend]}`}>{subtitle}</p>
    </div>
  )

  if (href) {
    // Wrap in a div that handles navigation separately from the explainable number
    return (
      <div className="relative">
        {Content}
        <Link
          href={href}
          className="absolute inset-0 z-0"
          aria-label={`${title} - Details anzeigen`}
        />
      </div>
    )
  }

  return Content
}
