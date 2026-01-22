/**
 * Form section component - card wrapper for form groups
 */

interface FormSectionProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function FormSection({
  title,
  description,
  children,
  className = '',
}: FormSectionProps) {
  return (
    <div className={`card ${className}`}>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {description && (
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

interface FormFieldProps {
  label: string
  description?: string
  required?: boolean
  error?: string
  children: React.ReactNode
}

export function FormField({
  label,
  description,
  required = false,
  error,
  children,
}: FormFieldProps) {
  return (
    <div>
      <label className="label">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {description && (
        <p className="text-xs text-gray-500 mb-2">{description}</p>
      )}
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

interface FormActionsProps {
  children: React.ReactNode
  className?: string
}

export function FormActions({ children, className = '' }: FormActionsProps) {
  return (
    <div className={`flex gap-3 pt-4 ${className}`}>
      {children}
    </div>
  )
}
