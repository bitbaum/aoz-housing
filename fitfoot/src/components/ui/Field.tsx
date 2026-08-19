import type { ReactNode } from 'react'

/**
 * Form field primitive — label + control + hint/error, in one place.
 * Every form in the app used to hand-roll this markup (label className +
 * input className + conditional hint/error paragraph) independently;
 * this is the single definition. The control itself (input/select/
 * textarea) is passed as a child so this stays agnostic of field type.
 */
export function Field({
  id,
  label,
  hint,
  error,
  required,
  children,
}: {
  id: string
  label: string
  hint?: string
  error?: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <div>
      <label htmlFor={id} className="label-field">
        {label}
        {required && (
          <span className="text-gold-600" aria-hidden>
            {' '}
            *
          </span>
        )}
      </label>
      {children}
      {error ? <p className="error-field">{error}</p> : hint ? <p className="hint-field">{hint}</p> : null}
    </div>
  )
}
