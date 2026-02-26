'use client'

/**
 * Dynamic Form Field Renderer
 *
 * Renders form inputs based on factor configuration.
 * This component is the key to making the system modular -
 * add a factor to config, it automatically appears in forms.
 */

import type { FactorDef } from '@/lib/config/types'

export type FormFieldValue = string | number | boolean | string[] | Date | null | undefined

interface DynamicFormFieldProps {
  factor: FactorDef
  value?: FormFieldValue
  disabled?: boolean
}

export function DynamicFormField({ factor, value, disabled }: DynamicFormFieldProps) {
  switch (factor.type) {
    case 'text':
      return <TextField factor={factor} value={value as string | undefined} disabled={disabled} />
    case 'enum':
      return <EnumField factor={factor} value={value as string | undefined} disabled={disabled} />
    case 'scale':
      return <ScaleField factor={factor} value={value as number | undefined} disabled={disabled} />
    case 'boolean':
      return <BooleanField factor={factor} value={value as boolean | undefined} disabled={disabled} />
    case 'multi':
      return <MultiField factor={factor} value={value as string[] | undefined} disabled={disabled} />
    default:
      return null
  }
}

// =============================================================================
// FIELD TYPE COMPONENTS
// =============================================================================

function TextField({
  factor,
  value,
  disabled,
}: {
  factor: FactorDef & { type: 'text' }
  value?: string
  disabled?: boolean
}) {
  const isTextarea = factor.id === 'notes' || factor.id === 'concerns'

  if (isTextarea) {
    return (
      <div>
        <label className="label">
          {factor.label}
          {factor.required && ' *'}
        </label>
        {factor.description && (
          <p className="text-xs text-gray-500 mb-2">{factor.description}</p>
        )}
        <textarea
          name={factor.id}
          rows={4}
          defaultValue={value || factor.default || ''}
          placeholder={factor.placeholder}
          className="input"
          disabled={disabled}
          required={factor.required}
        />
      </div>
    )
  }

  return (
    <div>
      <label className="label">
        {factor.label}
        {factor.required && ' *'}
      </label>
      {factor.description && (
        <p className="text-xs text-gray-500 mb-2">{factor.description}</p>
      )}
      <input
        type="text"
        name={factor.id}
        defaultValue={value || factor.default || ''}
        placeholder={factor.placeholder}
        className="input"
        disabled={disabled}
        required={factor.required}
        readOnly={disabled}
      />
      {disabled && (
        <p className="text-xs text-gray-500 mt-1">Kann nicht geändert werden</p>
      )}
    </div>
  )
}

function EnumField({
  factor,
  value,
  disabled,
}: {
  factor: FactorDef & { type: 'enum' }
  value?: string
  disabled?: boolean
}) {
  return (
    <div>
      <label className="label">
        {factor.label}
        {factor.required && ' *'}
      </label>
      {factor.description && (
        <p className="text-xs text-gray-500 mb-2">{factor.description}</p>
      )}
      <select
        name={factor.id}
        defaultValue={value || factor.default || ''}
        className="input"
        disabled={disabled}
        required={factor.required}
      >
        <option value="">Bitte wählen</option>
        {factor.options.map((opt) => (
          <option key={opt} value={opt}>
            {factor.optionLabels[opt]}
          </option>
        ))}
      </select>
    </div>
  )
}

function ScaleField({
  factor,
  value,
  disabled,
}: {
  factor: FactorDef & { type: 'scale' }
  value?: number
  disabled?: boolean
}) {
  const currentValue = value ?? factor.default
  const isNumericInput = factor.max > 5 // Use number input for larger ranges

  if (isNumericInput) {
    return (
      <div>
        <label className="label">
          {factor.label}
          {factor.required && ' *'}
        </label>
        {factor.description && (
          <p className="text-xs text-gray-500 mb-2">{factor.description}</p>
        )}
        <input
          type="number"
          name={factor.id}
          min={factor.min}
          max={factor.max}
          defaultValue={currentValue}
          className="input"
          disabled={disabled}
          required={factor.required}
        />
      </div>
    )
  }

  // Visual scale for 1-5 ranges
  const range = Array.from(
    { length: factor.max - factor.min + 1 },
    (_, i) => factor.min + i
  )

  return (
    <div>
      <label className="label">
        {factor.label}
        {factor.required && ' *'}
      </label>
      {factor.description && (
        <p className="text-xs text-gray-500 mb-2">{factor.description}</p>
      )}
      <div className="flex gap-2">
        {range.map((level) => (
          <label key={level} className="flex-1 cursor-pointer">
            <input
              type="radio"
              name={factor.id}
              value={level}
              defaultChecked={level === currentValue}
              className="sr-only peer"
              disabled={disabled}
            />
            <div className="py-3 text-center rounded-lg border-2 border-gray-200 peer-checked:border-aoz-primary peer-checked:bg-aoz-primary peer-checked:text-white transition-colors">
              {level}
            </div>
          </label>
        ))}
      </div>
      {(factor.lowLabel || factor.highLabel) && (
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{factor.lowLabel}</span>
          <span>{factor.highLabel}</span>
        </div>
      )}
    </div>
  )
}

function BooleanField({
  factor,
  value,
  disabled,
}: {
  factor: FactorDef & { type: 'boolean' }
  value?: boolean
  disabled?: boolean
}) {
  const currentValue = value ?? factor.default

  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        name={factor.id}
        value="true"
        defaultChecked={currentValue}
        className="w-5 h-5 rounded border-gray-300 text-aoz-primary focus:ring-aoz-primary"
        disabled={disabled}
      />
      <span className="text-sm text-gray-700">{factor.label}</span>
      {factor.description && (
        <span className="text-xs text-gray-500">({factor.description})</span>
      )}
    </label>
  )
}

function MultiField({
  factor,
  value,
  disabled,
}: {
  factor: FactorDef & { type: 'multi' }
  value?: string[]
  disabled?: boolean
}) {
  const selectedValues = value || factor.default || []

  return (
    <div>
      <label className="label">
        {factor.label}
        {factor.required && ' *'}
      </label>
      {factor.description && (
        <p className="text-xs text-gray-500 mb-2">{factor.description}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {factor.options.map((opt) => (
          <label key={opt} className="cursor-pointer">
            <input
              type="checkbox"
              name={factor.id}
              value={opt}
              defaultChecked={selectedValues.includes(opt)}
              className="sr-only peer"
              disabled={disabled}
            />
            <div className="px-4 py-2 rounded-full border-2 border-gray-200 peer-checked:border-aoz-primary peer-checked:bg-aoz-primary peer-checked:text-white transition-colors text-sm">
              {factor.optionLabels[opt]}
            </div>
          </label>
        ))}
      </div>
    </div>
  )
}
