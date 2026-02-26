'use client'

import { useState, useRef, useEffect } from 'react'

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

  const sourceLabel = {
    database: 'Datenbank',
    calculation: 'Berechnung',
    derived: 'Abgeleitet',
  }[explanation.source]

  return (
    <span className="relative inline-block">
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`${sizeClasses[size]} ${className} cursor-pointer hover:underline decoration-dotted underline-offset-4 decoration-gray-400 focus:outline-none focus:ring-2 focus:ring-aoz-primary focus:ring-offset-2 rounded`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        {value}
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          role="dialog"
          aria-label={`Erklärung für ${explanation.label}`}
          className="absolute z-50 left-1/2 -translate-x-1/2 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 p-4 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          {/* Arrow */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-l border-t border-gray-200 rotate-45" />

          {/* Header */}
          <div className="flex items-start justify-between mb-3 relative">
            <div>
              <h3 className="font-semibold text-gray-900">{explanation.label}</h3>
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                <span>{sourceIcon}</span>
                <span>{sourceLabel}</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700 -mt-1 -mr-1 p-1"
              aria-label="Schliessen"
            >
              ✕
            </button>
          </div>

          {/* Source description */}
          <div className="mb-3">
            <p className="text-sm text-gray-600">{explanation.sourceDescription}</p>
          </div>

          {/* Formula (if calculation) */}
          {explanation.formula && (
            <div className="mb-3 p-2 bg-gray-50 rounded border border-gray-100">
              <p className="text-xs text-gray-500 mb-1">Formel</p>
              <code className="text-sm text-gray-800 font-mono">{explanation.formula}</code>
            </div>
          )}

          {/* Data points */}
          {explanation.dataPoints && explanation.dataPoints.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-2">Datenpunkte</p>
              <div className="space-y-1">
                {explanation.dataPoints.map((point, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-600">{point.label}</span>
                    <span className="font-medium text-gray-900">{point.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interpretation */}
          {explanation.interpretation && (
            <div className="pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-1">Interpretation</p>
              <p className="text-sm text-gray-700">{explanation.interpretation}</p>
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
    good: 'text-green-600',
    neutral: 'text-gray-500',
    warning: 'text-orange-600',
  }

  const Content = (
    <div className="card-hover">
      <p className="text-sm text-gray-500">{title}</p>
      <div className="mt-1">
        <ExplainableNumber
          value={value}
          explanation={explanation}
          size="xl"
          className="text-gray-900"
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
        <a
          href={href}
          className="absolute inset-0 z-0"
          aria-label={`${title} - Details anzeigen`}
        />
      </div>
    )
  }

  return Content
}
