'use client'

import type { FactorDef } from '@/lib/config/types'
import { UI_LABELS, FORM_VALIDATION_UX_LABELS } from '@/lib/constants/labels'

export function TextField({
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
        <label htmlFor={factor.id} className="label">
          {factor.label}
          {factor.required && ' *'}
        </label>
        {factor.description && (
          <p id={`${factor.id}-desc`} className="text-xs text-gray-500 mb-2">{factor.description}</p>
        )}
        <textarea
          id={factor.id}
          name={factor.id}
          rows={4}
          defaultValue={value || factor.default || ''}
          placeholder={factor.placeholder}
          className="input"
          disabled={disabled}
          required={factor.required}
          aria-describedby={factor.description ? `${factor.id}-desc` : undefined}
        />
      </div>
    )
  }

  return (
    <div>
      <label htmlFor={factor.id} className="label">
        {factor.label}
        {factor.required && ' *'}
      </label>
      {factor.description && (
        <p id={`${factor.id}-desc`} className="text-xs text-gray-500 mb-2">{factor.description}</p>
      )}
      <input
        id={factor.id}
        type="text"
        name={factor.id}
        defaultValue={value || factor.default || ''}
        placeholder={factor.placeholder}
        className={`input ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        disabled={disabled}
        required={factor.required}
        readOnly={disabled}
        aria-describedby={factor.description ? `${factor.id}-desc` : undefined}
      />
      {disabled && (
        <p className="text-xs text-gray-500 mt-1">{FORM_VALIDATION_UX_LABELS.readOnly}</p>
      )}
    </div>
  )
}

export function EnumField({
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
      <label htmlFor={factor.id} className="label">
        {factor.label}
        {factor.required && ' *'}
      </label>
      {factor.description && (
        <p id={`${factor.id}-desc`} className="text-xs text-gray-500 mb-2">{factor.description}</p>
      )}
      <select
        id={factor.id}
        name={factor.id}
        defaultValue={value || factor.default || ''}
        className="input"
        disabled={disabled}
        required={factor.required}
        aria-describedby={factor.description ? `${factor.id}-desc` : undefined}
      >
        <option value="">{UI_LABELS.selectPlaceholder}</option>
        {factor.options.map((opt) => (
          <option key={opt} value={opt}>
            {factor.optionLabels[opt]}
          </option>
        ))}
      </select>
    </div>
  )
}

export function ScaleField({
  factor,
  value,
  disabled,
}: {
  factor: FactorDef & { type: 'scale' }
  value?: number
  disabled?: boolean
}) {
  const currentValue = value ?? factor.default
  const isNumericInput = factor.max > 5

  if (isNumericInput) {
    return (
      <div>
        <label htmlFor={factor.id} className="label">
          {factor.label}
          {factor.required && ' *'}
        </label>
        {factor.description && (
          <p id={`${factor.id}-desc`} className="text-xs text-gray-500 mb-2">{factor.description}</p>
        )}
        <input
          id={factor.id}
          type="number"
          name={factor.id}
          min={factor.min}
          max={factor.max}
          defaultValue={currentValue}
          className="input"
          disabled={disabled}
          required={factor.required}
          aria-describedby={factor.description ? `${factor.id}-desc` : undefined}
        />
      </div>
    )
  }

  const range = Array.from(
    { length: factor.max - factor.min + 1 },
    (_, i) => factor.min + i
  )

  return (
    <fieldset>
      <legend className="label">
        {factor.label}
        {factor.required && ' *'}
      </legend>
      {factor.description && (
        <p className="text-xs text-gray-500 mb-2">{factor.description}</p>
      )}
      <div className="flex gap-2">
        {range.map((level) => {
          const ariaLabel = level === factor.min && factor.lowLabel
            ? `${level} – ${factor.lowLabel}`
            : level === factor.max && factor.highLabel
              ? `${level} – ${factor.highLabel}`
              : String(level)
          return (
            <label key={level} className="flex-1 cursor-pointer">
              <input
                type="radio"
                name={factor.id}
                value={level}
                defaultChecked={level === currentValue}
                className="sr-only peer"
                disabled={disabled}
                aria-label={ariaLabel}
              />
              <div className="py-3 text-center rounded-lg border-2 border-gray-200 peer-checked:border-aoz-primary peer-checked:bg-aoz-primary peer-checked:text-white transition-colors">
                {level}
              </div>
            </label>
          )
        })}
      </div>
      {(factor.lowLabel || factor.highLabel) && (
        <div className="flex justify-between text-xs text-gray-500 mt-1" aria-hidden="true">
          <span>{factor.lowLabel}</span>
          <span>{factor.highLabel}</span>
        </div>
      )}
    </fieldset>
  )
}

export function BooleanField({
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

export function MultiField({
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
    <fieldset>
      <legend className="label">
        {factor.label}
        {factor.required && ' *'}
      </legend>
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
              aria-label={factor.optionLabels[opt]}
            />
            <div className="px-4 py-2 rounded-full border-2 border-gray-200 peer-checked:border-aoz-primary peer-checked:bg-aoz-primary peer-checked:text-white transition-colors text-sm">
              {factor.optionLabels[opt]}
            </div>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
