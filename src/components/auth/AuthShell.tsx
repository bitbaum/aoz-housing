/**
 * Shared chrome for the account pages (login, register, forgot/reset
 * password): logo header, theme toggle, the card, and the success state.
 * SSOT — the four pages differ only in their form.
 */

import { Logo } from '@/components/ui/Logo'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { APP_LABELS } from '@/lib/constants/labels'

interface AuthShellProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  /** Rendered below the card (secondary actions, demo doors). */
  footer?: React.ReactNode
}

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="w-full max-w-md">
      <div className="fixed right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="text-center mb-8">
        <div className="flex justify-center mb-2">
          <Logo size="xl" />
        </div>
        <p className="text-ui-muted">{APP_LABELS.tagline}</p>
      </div>

      <div className="card p-6 sm:p-8">
        <h1 className="text-lg font-semibold text-ui-text mb-1 text-center">{title}</h1>
        {subtitle ? <p className="text-sm text-ui-muted mb-6 text-center">{subtitle}</p> : null}
        {children}
      </div>

      {footer}
    </div>
  )
}

interface AuthSuccessProps {
  message: string
  detail?: string
}

/** Green checkmark confirmation, shared by login/register/reset outcomes. */
export function AuthSuccess({ message, detail }: AuthSuccessProps) {
  return (
    <div className="text-center py-4" role="status" aria-live="polite">
      <div className="w-12 h-12 mx-auto mb-3 rounded-md bg-status-success/15 ring-1 ring-status-success/25 flex items-center justify-center">
        <svg
          className="w-6 h-6 text-status-success-text"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <p className="text-status-success-text font-medium">{message}</p>
      {detail ? <p className="text-sm text-ui-muted mt-2">{detail}</p> : null}
    </div>
  )
}
