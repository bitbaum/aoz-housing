'use client'

import {
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { RESIDENT_DIMENSIONS } from '@/lib/config/resident-factors'
import { FACTOR_SCIENCE } from '@/lib/config/algorithm-docs'
import { ALGORITHM_OVERVIEW_LABELS } from '@/lib/constants'
import {
  getFactorsByDimension,
  EvidenceStrengthBadge,
} from './shared'

export function DimensionsTab({
  expandedDimension,
  setExpandedDimension,
}: {
  expandedDimension: string | null
  setExpandedDimension: (id: string | null) => void
}) {
  const colors = {
    lifestyle: 'purple',
    social: 'blue',
    practical: 'green',
    requirements: 'orange',
  } as const

  return (
    <div className="space-y-4">
      <p className="text-ui-muted mb-4">
        {ALGORITHM_OVERVIEW_LABELS.dimensionsIntro}
      </p>

      {RESIDENT_DIMENSIONS.map(dim => {
        const factors = getFactorsByDimension(dim.id)
        const isExpanded = expandedDimension === dim.id

        return (
          <div key={dim.id} className="border border-ui-border rounded-lg overflow-hidden">
            <button
              onClick={() => setExpandedDimension(isExpanded ? null : dim.id)}
              className="w-full flex items-start sm:items-center justify-between gap-3 p-4 text-left hover:bg-ui-subtle transition-colors min-h-[44px] focus-visible:ring-2 focus-visible:ring-aoz-primary focus-visible:ring-offset-2 rounded-lg"
              aria-expanded={isExpanded}
              aria-controls={`dimension-${dim.id}`}
            >
              <div className="flex items-start sm:items-center gap-3 min-w-0">
                <div className={`w-3 h-3 rounded-full bg-${colors[dim.id as keyof typeof colors]}-500 mt-1 sm:mt-0`} aria-hidden="true" />
                <div className="min-w-0">
                  <h3 className="font-semibold text-ui-text">{dim.label}</h3>
                  <p className="text-sm text-ui-muted">{dim.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                <span className="text-xs sm:text-sm text-ui-muted">{ALGORITHM_OVERVIEW_LABELS.factorsCount(factors.length)}</span>
                <span className="px-3 py-1 rounded-full text-sm font-bold bg-ui-subtle text-ui-muted">
                  {Math.round(dim.weight * 100)}%
                </span>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-ui-muted" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-ui-muted" />
                )}
              </div>
            </button>

            {isExpanded && (
              <div id={`dimension-${dim.id}`} className="p-4 pt-0 border-t border-ui-border">
                <div className="space-y-3 mt-4">
                  {factors.map(factor => {
                    const science = FACTOR_SCIENCE[factor.id]
                    return (
                      <div key={factor.id} className="bg-ui-subtle rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-ui-text">{factor.label}</h4>
                            {science && (
                              <EvidenceStrengthBadge strength={science.evidenceStrength} />
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-ui-surface border border-ui-border px-2 py-1 rounded">
                              {Math.round(factor.weight * 100)}%
                            </span>
                            <span className="text-xs bg-status-info/10 text-status-info-text px-2 py-1 rounded">
                              {factor.rule.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </div>
                        {factor.description && (
                          <p className="text-sm text-ui-muted mb-2">{factor.description}</p>
                        )}
                        {science && (
                          <div className="mt-3 pt-3 border-t border-ui-border">
                            <p className="text-sm text-ui-muted">{science.whyItMatters}</p>
                            {science.swissContext && (
                              <p className="text-xs text-aoz-primary mt-2 flex items-start gap-1">
                                <span>🇨🇭</span> {science.swissContext}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
