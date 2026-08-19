import type { ReactNode } from 'react'

/**
 * Layout primitives — the SSOT for page width, section rhythm, and
 * heading hierarchy. A page composes these instead of hand-typing
 * `max-w-7xl px-4 sm:px-6` (or a heading's size) on every screen.
 */

export function PageShell({
  children,
  size = 'default',
  className = '',
}: {
  children: ReactNode
  size?: 'default' | 'narrow' | 'wide'
  className?: string
}) {
  const maxWidth = size === 'narrow' ? 'max-w-3xl' : size === 'wide' ? 'max-w-7xl' : 'max-w-5xl'
  return (
    <div className={`mx-auto ${maxWidth} px-4 py-10 sm:px-6 sm:py-14 ${className}`}>{children}</div>
  )
}

export function PageHeader({
  eyebrow,
  title,
  description,
  align = 'left',
}: {
  eyebrow?: string
  title: ReactNode
  description?: ReactNode
  align?: 'left' | 'center'
}) {
  const alignment = align === 'center' ? 'text-center mx-auto' : ''
  return (
    <header className={alignment}>
      {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
      <h1 className="h1-display">{title}</h1>
      {description && <p className={`mt-4 max-w-2xl text-muted ${alignment}`}>{description}</p>}
    </header>
  )
}

export function SectionHeading({
  title,
  description,
  align = 'left',
}: {
  title: ReactNode
  description?: ReactNode
  align?: 'left' | 'center'
}) {
  const alignment = align === 'center' ? 'text-center mx-auto' : ''
  return (
    <div className={alignment}>
      <h2 className="h2-section">{title}</h2>
      {description && <p className={`mt-3 max-w-2xl text-muted ${alignment}`}>{description}</p>}
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="rounded-lg border border-dashed border-line-strong p-10 text-center sm:p-16">
      {icon && (
        <div className="mx-auto mb-4 text-4xl" aria-hidden>
          {icon}
        </div>
      )}
      <p className="h3-card">{title}</p>
      {description && <p className="mx-auto mt-2 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
