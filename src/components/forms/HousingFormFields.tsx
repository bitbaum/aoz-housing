'use client'

/**
 * Housing Form Fields
 *
 * Config-driven form rendering using HOUSING_FACTORS and HOUSING_FORM_SECTIONS.
 * Add a new factor to config → it automatically appears in the form.
 */

import { DynamicFormField } from './DynamicFormField'
import {
  HOUSING_FORM_SECTIONS,
  getHousingFactorsBySection,
} from '@/lib/config/housing-factors'

interface HousingFormFieldsProps {
  defaultValues?: Record<string, any>
  isEdit?: boolean
}

export function HousingFormFields({ defaultValues = {}, isEdit = false }: HousingFormFieldsProps) {
  // Get sections sorted by order
  const sections = [...HOUSING_FORM_SECTIONS].sort((a, b) => a.order - b.order)

  return (
    <>
      {sections.map((section) => {
        const factors = getHousingFactorsBySection(section.id)

        // Skip empty sections
        if (factors.length === 0) return null

        // Determine layout based on section content
        const hasOnlyBooleans = factors.every(f => f.type === 'boolean')
        const hasScalesOrNumbers = factors.some(f => f.type === 'scale')
        const isBasicSection = section.id === 'basic'

        return (
          <div key={section.id} className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{section.label}</h2>
            {section.description && (
              <p className="text-sm text-gray-500 mb-4">{section.description}</p>
            )}

            {hasOnlyBooleans ? (
              // Horizontal layout for boolean-only sections
              <div className="flex flex-wrap gap-6">
                {factors.map((factor) => (
                  <DynamicFormField
                    key={factor.id}
                    factor={factor}
                    value={defaultValues[factor.id]}
                  />
                ))}
              </div>
            ) : isBasicSection ? (
              // Grid layout for basic info
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {factors.map((factor) => (
                  <div key={factor.id} className={factor.id === 'address' ? 'md:col-span-2' : ''}>
                    <DynamicFormField
                      factor={factor}
                      value={defaultValues[factor.id]}
                      disabled={isEdit && factor.id === 'code'}
                    />
                  </div>
                ))}
              </div>
            ) : hasScalesOrNumbers ? (
              // Grid layout for numeric fields (capacity, facilities)
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {factors
                    .filter(f => f.type === 'scale')
                    .map((factor) => (
                      <DynamicFormField
                        key={factor.id}
                        factor={factor}
                        value={defaultValues[factor.id]}
                      />
                    ))}
                </div>
                {/* Booleans in a row after numbers */}
                {factors.some(f => f.type === 'boolean') && (
                  <div className="flex flex-wrap gap-6">
                    {factors
                      .filter(f => f.type === 'boolean')
                      .map((factor) => (
                        <DynamicFormField
                          key={factor.id}
                          factor={factor}
                          value={defaultValues[factor.id]}
                        />
                      ))}
                  </div>
                )}
                {/* Text fields after booleans */}
                {factors
                  .filter(f => f.type === 'text')
                  .map((factor) => (
                    <DynamicFormField
                      key={factor.id}
                      factor={factor}
                      value={defaultValues[factor.id]}
                    />
                  ))}
              </div>
            ) : (
              // Standard vertical layout
              <div className="space-y-4">
                {factors
                  .filter(f => f.type !== 'boolean')
                  .map((factor) => (
                    <DynamicFormField
                      key={factor.id}
                      factor={factor}
                      value={defaultValues[factor.id]}
                    />
                  ))}
                {/* Booleans in a row at the end */}
                {factors.some(f => f.type === 'boolean') && (
                  <div className="flex flex-wrap gap-6">
                    {factors
                      .filter(f => f.type === 'boolean')
                      .map((factor) => (
                        <DynamicFormField
                          key={factor.id}
                          factor={factor}
                          value={defaultValues[factor.id]}
                        />
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}
