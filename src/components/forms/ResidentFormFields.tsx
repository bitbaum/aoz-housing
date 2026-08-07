'use client'

/**
 * Resident Form Fields
 *
 * Config-driven form rendering using RESIDENT_FACTORS and RESIDENT_FORM_SECTIONS.
 * Add a new factor to config → it automatically appears in the form, and the
 * assistant can fill it, because the AI field registry is derived from the same
 * config (see lib/config/ai-forms.ts).
 *
 * The factor answers live in one `useAiForm` store that both the caseworker and
 * the assistant write to — that shared store is what lets somebody describe an
 * intake conversation in prose and then keep correcting it by talking. The
 * inputs keep their `name` attributes, so the enclosing
 * `<form action={createResident}>` still submits plain FormData.
 *
 * Medical documentation is deliberately NOT part of that store: those fields
 * are outside RESIDENT_FACTORS and therefore outside the AI registry, so the
 * model is never shown them and can never write them.
 */

import { useState } from 'react'
import { useAiForm } from '@fleet/ai-forms/react'
import { DynamicFormField } from './DynamicFormField'
import type { FormFieldValue } from './DynamicFormField'
import { AiFormBar } from './AiFormBar'
import {
  RESIDENT_FORM_SECTIONS,
  getFactorsBySection,
} from '@/lib/config/resident-factors'
import { RESIDENT_INTAKE_FORM, residentIntakeInitialValues } from '@/lib/config/ai-forms'
import { MEDICAL_DOC_TYPE_LABELS } from '@/lib/config/placement-spots'
import { RESIDENT_FORM_LABELS } from '@/lib/constants'

type FormValues = Record<string, FormFieldValue>

interface ResidentFormFieldsProps {
  defaultValues?: FormValues
  isEdit?: boolean
}

export function ResidentFormFields({ defaultValues = {}, isEdit = false }: ResidentFormFieldsProps) {
  // Get sections sorted by order
  const sections = [...RESIDENT_FORM_SECTIONS].sort((a, b) => a.order - b.order)

  const form = useAiForm({
    target: RESIDENT_INTAKE_FORM.key,
    fields: RESIDENT_INTAKE_FORM.fields,
    initialValues: residentIntakeInitialValues(defaultValues),
  })

  /** Bind one factor to the shared store. */
  const bind = (factorId: string) => ({
    value: form.values[factorId] as FormFieldValue,
    onChange: (next: FormFieldValue) => form.setValue(factorId, next),
    aiTouched: form.isAiTouched(factorId),
  })

  return (
    <>
      <AiFormBar form={form} />
      {sections.map((section) => {
        const factors = getFactorsBySection(section.id)

        // Skip empty sections
        if (factors.length === 0) return null

        // Special handling for sections with different layouts
        const isGridSection = section.id === 'basic'
        const isBooleanGroupSection = ['preferences'].includes(section.id)

        return (
          <div key={section.id} className="card">
            <h2 className="text-lg font-semibold text-ui-text mb-4">{section.label}</h2>
            {section.description && (
              <p className="text-sm text-ui-muted mb-4">{section.description}</p>
            )}

            {isGridSection ? (
              // Grid layout for basic info
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {factors.map((factor) => (
                  <DynamicFormField
                    key={factor.id}
                    factor={factor}
                    {...bind(factor.id)}
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
                    {...bind(factor.id)}
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
                      {...bind(factor.id)}
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
                          {...bind(factor.id)}
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
  const [hasDoc, setHasDoc] = useState(!!defaultValues.hasMedicalDocumentation)

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-ui-text mb-4">{RESIDENT_FORM_LABELS.medDocTitle}</h2>
      <p className="text-sm text-ui-muted mb-4">
        {RESIDENT_FORM_LABELS.medDocDesc}
      </p>
      <div className="space-y-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="hasMedicalDocumentation"
            value="true"
            checked={hasDoc}
            onChange={(e) => setHasDoc(e.target.checked)}
            className="w-5 h-5 rounded border-ui-border-strong text-brand-primary focus:ring-brand-primary"
          />
          <div>
            <span className="text-sm font-medium text-ui-muted">
              {RESIDENT_FORM_LABELS.medDocCheckboxLabel}
            </span>
            <p className="text-xs text-ui-muted">
              {RESIDENT_FORM_LABELS.medDocCheckboxDesc}
            </p>
          </div>
        </label>

        {hasDoc && (
          <div className="pl-8 space-y-4 border-l-2 border-ui-border ml-2">
            <div>
              <label className="label">{RESIDENT_FORM_LABELS.medDocTypeLabel}</label>
              <div className="space-y-2">
                {Object.entries(MEDICAL_DOC_TYPE_LABELS).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="medicalDocType"
                      value={key}
                      defaultChecked={defaultValues.medicalDocType === key}
                      className="w-4 h-4 border-ui-border-strong text-brand-primary focus:ring-brand-primary"
                    />
                    <span className="text-sm text-ui-muted">{label}</span>
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
              <p className="text-xs text-ui-muted mt-1">
                Nur Verwaltungsnotizen, keine medizinischen Details
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
