'use client'

/**
 * Dynamic Form Section Renderer
 *
 * Renders a complete form section with all its fields based on config.
 */

import type { FactorDef, FormSectionConfig } from '@/lib/config/types'
import { DynamicFormField } from './DynamicFormField'

interface DynamicFormSectionProps {
  section: FormSectionConfig
  factors: FactorDef[]
  values?: Record<string, any>
  disabledFields?: string[]
}

export function DynamicFormSection({
  section,
  factors,
  values = {},
  disabledFields = [],
}: DynamicFormSectionProps) {
  // Separate boolean fields for inline rendering
  const booleanFactors = factors.filter(f => f.type === 'boolean')
  const otherFactors = factors.filter(f => f.type !== 'boolean')

  // Group non-boolean factors into grid (2 columns for basic info, single column for others)
  const useGrid = section.id === 'basic' || section.id === 'capacity'

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        {section.label}
      </h2>
      {section.description && (
        <p className="text-sm text-gray-500 mb-4">{section.description}</p>
      )}

      {/* Non-boolean fields */}
      {otherFactors.length > 0 && (
        <div className={useGrid ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-4'}>
          {otherFactors.map(factor => (
            <div
              key={factor.id}
              className={factor.id === 'address' || factor.id === 'notes' ? 'md:col-span-2' : ''}
            >
              <DynamicFormField
                factor={factor}
                value={values[factor.id]}
                disabled={disabledFields.includes(factor.id)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Boolean fields rendered inline */}
      {booleanFactors.length > 0 && (
        <div className={`flex flex-wrap gap-6 ${otherFactors.length > 0 ? 'mt-4' : ''}`}>
          {booleanFactors.map(factor => (
            <DynamicFormField
              key={factor.id}
              factor={factor}
              value={values[factor.id]}
              disabled={disabledFields.includes(factor.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
