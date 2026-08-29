'use client'

/**
 * Controlled inputs for one factor.
 *
 * These are controlled rather than uncontrolled because the AI assistant and
 * the user write to the same store — that shared store is what makes "change
 * it by talking to it" possible at all. They keep their `name` attributes, so
 * the surrounding `<form action={serverAction}>` still submits ordinary
 * FormData and no server action had to change.
 *
 * `value` is the stored answer already resolved through `factorDisplayValue`,
 * so an unanswered question shows its config default without that default
 * being recorded as an answer.
 */

import type { FactorDef } from '@/lib/config/types'
import { isTextareaFactor } from '@/lib/config/factor-fields'
import { UI_LABELS, FORM_VALIDATION_UX_LABELS, AI_FORM_LABELS } from '@/lib/constants/labels'

/** Marks a field the assistant wrote, so staff can see what to double-check. */
function AiMarker({ show }: { show?: boolean }) {
  if (!show) return null
  return (
    <span
      title={AI_FORM_LABELS.aiMarkerTitle}
      className="ml-2 align-middle rounded px-1.5 py-0.5 text-xs font-medium bg-brand-primary/10 text-brand-primary ring-1 ring-brand-primary/25"
    >
      {AI_FORM_LABELS.aiMarker}
    </span>
  )
}

interface FieldChrome {
  disabled?: boolean
  aiTouched?: boolean
}

export function TextField({
  factor,
  value,
  disabled,
  aiTouched,
  onChange,
}: FieldChrome & {
  factor: FactorDef & { type: 'text' }
  value?: string
  onChange: (next: string) => void
}) {
  const shared = {
    id: factor.id,
    name: factor.id,
    value: value ?? '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(e.target.value),
    placeholder: factor.placeholder,
    disabled,
    required: factor.required,
    'aria-describedby': factor.description ? `${factor.id}-desc` : undefined,
  }

  return (
    <div>
      <label htmlFor={factor.id} className="label">
        {factor.label}
        {factor.required && ' *'}
        <AiMarker show={aiTouched} />
      </label>
      {factor.description && (
        <p id={`${factor.id}-desc`} className="text-xs text-ui-muted mb-2">
          {factor.description}
        </p>
      )}
      {isTextareaFactor(factor) ? (
        <textarea {...shared} rows={4} className="input" />
      ) : (
        <input
          {...shared}
          type="text"
          className={`input ${disabled ? 'bg-ui-subtle cursor-not-allowed' : ''}`}
          readOnly={disabled}
        />
      )}
      {disabled && !isTextareaFactor(factor) && (
        <p className="text-xs text-ui-muted mt-1">{FORM_VALIDATION_UX_LABELS.readOnly}</p>
      )}
    </div>
  )
}

export function EnumField({
  factor,
  value,
  disabled,
  aiTouched,
  onChange,
}: FieldChrome & {
  factor: FactorDef & { type: 'enum' }
  value?: string
  onChange: (next: string) => void
}) {
  return (
    <div>
      <label htmlFor={factor.id} className="label">
        {factor.label}
        {factor.required && ' *'}
        <AiMarker show={aiTouched} />
      </label>
      {factor.description && (
        <p id={`${factor.id}-desc`} className="text-xs text-ui-muted mb-2">
          {factor.description}
        </p>
      )}
      <select
        id={factor.id}
        name={factor.id}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
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
  aiTouched,
  onChange,
}: FieldChrome & {
  factor: FactorDef & { type: 'scale' }
  value?: number
  onChange: (next: number | '') => void
}) {
  const isNumericInput = factor.max > 5

  if (isNumericInput) {
    return (
      <div>
        <label htmlFor={factor.id} className="label">
          {factor.label}
          {factor.required && ' *'}
          <AiMarker show={aiTouched} />
        </label>
        {factor.description && (
          <p id={`${factor.id}-desc`} className="text-xs text-ui-muted mb-2">
            {factor.description}
          </p>
        )}
        <input
          id={factor.id}
          type="number"
          inputMode="numeric"
          name={factor.id}
          min={factor.min}
          max={factor.max}
          value={value ?? ''}
          // Number('') is 0, which would clamp up to the field minimum and turn
          // a cleared box into a real answer. Keep empty as empty.
          onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
          className="input"
          disabled={disabled}
          required={factor.required}
          aria-describedby={factor.description ? `${factor.id}-desc` : undefined}
        />
      </div>
    )
  }

  const range = Array.from({ length: factor.max - factor.min + 1 }, (_, i) => factor.min + i)

  return (
    <fieldset>
      <legend className="label">
        {factor.label}
        {factor.required && ' *'}
        <AiMarker show={aiTouched} />
      </legend>
      {factor.description && <p className="text-xs text-ui-muted mb-2">{factor.description}</p>}
      <div className="flex gap-2">
        {range.map((level) => {
          const ariaLabel =
            level === factor.min && factor.lowLabel
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
                checked={level === value}
                onChange={() => onChange(level)}
                className="sr-only peer"
                disabled={disabled}
                aria-label={ariaLabel}
              />
              <div className="py-3 text-center rounded-lg border-2 border-ui-border peer-checked:border-brand-primary peer-checked:bg-brand-primary peer-checked:text-ui-on-accent transition-colors">
                {level}
              </div>
            </label>
          )
        })}
      </div>
      {(factor.lowLabel || factor.highLabel) && (
        <div className="flex justify-between text-xs text-ui-muted mt-1" aria-hidden="true">
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
  aiTouched,
  onChange,
}: FieldChrome & {
  factor: FactorDef & { type: 'boolean' }
  value?: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        name={factor.id}
        value="true"
        checked={value ?? false}
        onChange={(e) => onChange(e.target.checked)}
        className="w-5 h-5 rounded border-ui-border-strong text-brand-primary focus:ring-brand-primary"
        disabled={disabled}
      />
      <span className="text-sm text-ui-muted">{factor.label}</span>
      {factor.description && <span className="text-xs text-ui-muted">({factor.description})</span>}
      <AiMarker show={aiTouched} />
    </label>
  )
}

export function MultiField({
  factor,
  value,
  disabled,
  aiTouched,
  onChange,
}: FieldChrome & {
  factor: FactorDef & { type: 'multi' }
  value?: string[]
  onChange: (next: string[]) => void
}) {
  const selected = value ?? []

  return (
    <fieldset>
      <legend className="label">
        {factor.label}
        {factor.required && ' *'}
        <AiMarker show={aiTouched} />
      </legend>
      {factor.description && <p className="text-xs text-ui-muted mb-2">{factor.description}</p>}
      <div className="flex flex-wrap gap-2">
        {factor.options.map((opt) => (
          <label key={opt} className="cursor-pointer">
            <input
              type="checkbox"
              name={factor.id}
              value={opt}
              checked={selected.includes(opt)}
              onChange={(e) =>
                onChange(e.target.checked ? [...selected, opt] : selected.filter((v) => v !== opt))
              }
              className="sr-only peer"
              disabled={disabled}
              aria-label={factor.optionLabels[opt]}
            />
            <div className="px-4 py-2 rounded-sm border-2 border-ui-border peer-checked:border-brand-primary peer-checked:bg-brand-primary peer-checked:text-ui-on-accent transition-colors text-sm">
              {factor.optionLabels[opt]}
            </div>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
