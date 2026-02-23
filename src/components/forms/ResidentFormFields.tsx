'use client'

/**
 * Resident Form Fields
 *
 * Config-driven form rendering using RESIDENT_FACTORS and RESIDENT_FORM_SECTIONS.
 * Add a new factor to config → it automatically appears in the form.
 */

import { DynamicFormField } from './DynamicFormField'
import type { FormFieldValue } from './DynamicFormField'
import {
  RESIDENT_FORM_SECTIONS,
  getFactorsBySection,
} from '@/lib/config/resident-factors'
import { MEDICAL_DOC_TYPE_LABELS } from '@/lib/config/placement-spots'

type FormValues = Record<string, FormFieldValue>

interface ResidentFormFieldsProps {
  defaultValues?: FormValues
  isEdit?: boolean
}

export function ResidentFormFields({ defaultValues = {}, isEdit = false }: ResidentFormFieldsProps) {
  // Get sections sorted by order
  const sections = [...RESIDENT_FORM_SECTIONS].sort((a, b) => a.order - b.order)

  return (
    <>
      {sections.map((section) => {
        const factors = getFactorsBySection(section.id)

        // Skip empty sections
        if (factors.length === 0) return null

        // Special handling for sections with different layouts
        const isGridSection = section.id === 'basic'
        const isBooleanGroupSection = ['preferences'].includes(section.id)

        return (
          <div key={section.id} className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{section.label}</h2>
            {section.description && (
              <p className="text-sm text-gray-500 mb-4">{section.description}</p>
            )}

            {isGridSection ? (
              // Grid layout for basic info
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {factors.map((factor) => (
                  <DynamicFormField
                    key={factor.id}
                    factor={factor}
                    value={defaultValues[factor.id]}
                    disabled={isEdit && factor.id === 'code'}
                  />
                ))}
              </div>
            ) : isBooleanGroupSection ? (
              // Horizontal layout for boolean groups
              <div className="flex flex-wrap gap-6">
                {factors.map((factor) => (
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
                {factors.map((factor) => {
                  // Group booleans together in a row
                  if (factor.type === 'boolean') {
                    return null // Handle below
                  }
                  return (
                    <DynamicFormField
                      key={factor.id}
                      factor={factor}
                      value={defaultValues[factor.id]}
                    />
                  )
                })}
                {/* Render booleans in a row at the end */}
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

      {/* Medical Documentation - Special section not in factor config */}
      <MedicalDocumentationSection defaultValues={defaultValues} />
    </>
  )
}

/**
 * Medical Documentation Section
 *
 * Separate from compatibility factors - relates to placement eligibility.
 */
function MedicalDocumentationSection({ defaultValues }: { defaultValues: FormValues }) {
  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Medizinische Dokumentation</h2>
      <p className="text-sm text-gray-500 mb-4">
        Berechtigung für Einzelzimmer oder Studio (erfordert ärztliche Bestätigung)
      </p>
      <div className="space-y-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="hasMedicalDocumentation"
            value="true"
            defaultChecked={!!defaultValues.hasMedicalDocumentation}
            className="w-5 h-5 rounded border-gray-300 text-aoz-primary focus:ring-aoz-primary"
          />
          <div>
            <span className="text-sm font-medium text-gray-700">
              Medizinische Dokumentation vorhanden
            </span>
            <p className="text-xs text-gray-400">
              Ärztliche Bestätigung für besondere Unterbringungsbedürfnisse
            </p>
          </div>
        </label>

        <div className="pl-8 space-y-4 border-l-2 border-gray-200 ml-2">
          <div>
            <label className="label">Art der Berechtigung</label>
            <div className="space-y-2">
              {Object.entries(MEDICAL_DOC_TYPE_LABELS).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="medicalDocType"
                    value={key}
                    defaultChecked={defaultValues.medicalDocType === key}
                    className="w-4 h-4 border-gray-300 text-aoz-primary focus:ring-aoz-primary"
                  />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Datum der Dokumentation</label>
            <input
              type="date"
              name="medicalDocDate"
              defaultValue={
                defaultValues.medicalDocDate
                  ? new Date(defaultValues.medicalDocDate as string | number | Date).toISOString().split('T')[0]
                  : ''
              }
              className="input max-w-xs"
            />
          </div>

          <div>
            <label className="label">Notizen zur Dokumentation</label>
            <textarea
              name="medicalDocNotes"
              rows={2}
              defaultValue={(defaultValues.medicalDocNotes as string) || ''}
              placeholder="z.B. Referenznummer, ausstellende Stelle..."
              className="input"
            />
            <p className="text-xs text-gray-400 mt-1">
              Nur Verwaltungsnotizen, keine medizinischen Details
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
