/**
 * Page-level layout primitives.
 *
 * These carry the design language's structural decisions — the display type
 * scale, the hairline separators, the vertical rhythm — so that a page author
 * composes a screen without ever restating them. `PageHeader` is the SSOT for
 * `<h1>`: every screen uses it, which is what keeps heading levels correct for
 * screen readers as well as visually consistent.
 */

import clsx from 'clsx'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

type PageShellProps = {
  children: React.ReactNode
  className?: string
}

export function PageShell({ children, className }: PageShellProps) {
  return (
    <div className={clsx('mx-auto w-full max-w-screen-2xl space-y-6 sm:space-y-8', className)}>
      {children}
    </div>
  )
}

type PageHeaderProps = {
  title: string
  description?: string
  eyebrow?: string
  actions?: React.ReactNode
  /** Optional back-link rendered above the title (use for nested detail/edit/new pages). */
  backHref?: string
  backLabel?: string
}

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  backHref,
  backLabel,
}: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-ui-border pb-5 sm:pb-6 md:flex-row md:items-end md:justify-between md:gap-8">
      <div className="min-w-0 max-w-3xl">
        {backHref ? (
          <Link
            href={backHref}
            className="-ml-1 mb-1 inline-flex min-h-[44px] items-center gap-1 pl-1 pr-2 text-sm text-ui-muted transition-colors hover:text-ui-text"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            {backLabel ?? 'Zurück'}
          </Link>
        ) : null}
        {eyebrow ? <p className="eyebrow mb-2">{eyebrow}</p> : null}
        <h1 className="text-2xl font-semibold leading-[1.1] text-ui-text sm:text-3xl lg:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ui-muted sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2 md:shrink-0 md:justify-end">
          {actions}
        </div>
      ) : null}
    </header>
  )
}

/**
 * Section heading inside a page. Sits below `PageHeader` in the hierarchy and
 * renders an `<h2>`, so pages never hand-roll one and never skip a level.
 */
type SectionHeaderProps = {
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
}

export function SectionHeader({ title, description, actions, className }: SectionHeaderProps) {
  return (
    <div className={clsx('flex flex-wrap items-end justify-between gap-3', className)}>
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-ui-text sm:text-lg">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm leading-relaxed text-ui-muted">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  )
}

type ToolbarProps = {
  children: React.ReactNode
  className?: string
}

export function Toolbar({ children, className }: ToolbarProps) {
  return (
    <div
      className={clsx(
        'flex flex-col gap-3 rounded-lg border border-ui-border bg-ui-surface px-3 py-3 md:flex-row md:items-center md:justify-between',
        className,
      )}
    >
      {children}
    </div>
  )
}

type EmptyStateProps = {
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-ui-border bg-ui-surface px-6 py-14 text-center">
      <h2 className="text-base font-semibold text-ui-text">{title}</h2>
      {description ? (
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ui-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  )
}

type ListShellProps = {
  children: React.ReactNode
  className?: string
}

export function ListShell({ children, className }: ListShellProps) {
  return (
    <div
      className={clsx(
        'overflow-hidden rounded-lg border border-ui-border bg-ui-surface',
        className,
      )}
    >
      {children}
    </div>
  )
}
