import clsx from 'clsx'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

type PageShellProps = {
  children: React.ReactNode
  className?: string
}

export function PageShell({ children, className }: PageShellProps) {
  return (
    <div className={clsx('mx-auto w-full max-w-screen-2xl space-y-6', className)}>
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
  /** Optional visual (icon, avatar) rendered to the left of the title block. */
  leading?: React.ReactNode
}

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  backHref,
  backLabel,
  leading,
}: PageHeaderProps) {
  const titleBlock = (
    <>
      <h1 className="text-2xl font-semibold leading-tight text-ui-text md:text-3xl">
        {title}
      </h1>
      {description ? (
        <p className="mt-2 text-sm leading-6 text-ui-muted md:text-base">
          {description}
        </p>
      ) : null}
    </>
  )

  return (
    <header className="flex flex-col gap-4 border-b border-ui-border pb-5 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl">
        {backHref ? (
          <Link
            href={backHref}
            className="mb-2 inline-flex items-center gap-1 text-sm text-ui-muted hover:text-aoz-primary min-h-[44px] -ml-1 pl-1 pr-2"
          >
            <ChevronLeft className="w-4 h-4" />
            {backLabel ?? 'Zurück'}
          </Link>
        ) : null}
        {eyebrow ? (
          <p className="mb-2 text-xs font-semibold uppercase tracking-normal text-ui-muted">
            {eyebrow}
          </p>
        ) : null}
        {leading ? (
          <div className="flex items-center gap-4">
            <div className="shrink-0">{leading}</div>
            <div>{titleBlock}</div>
          </div>
        ) : (
          titleBlock
        )}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          {actions}
        </div>
      ) : null}
    </header>
  )
}

type ToolbarProps = {
  children: React.ReactNode
  className?: string
}

export function Toolbar({ children, className }: ToolbarProps) {
  return (
    <div className={clsx('flex flex-col gap-3 rounded-lg border border-ui-border bg-ui-surface px-3 py-3 md:flex-row md:items-center md:justify-between', className)}>
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
    <div className="rounded-lg border border-dashed border-ui-border bg-ui-surface px-6 py-12 text-center">
      <h2 className="text-base font-semibold text-ui-text">{title}</h2>
      {description ? (
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ui-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  )
}

type ListShellProps = {
  children: React.ReactNode
  className?: string
}

export function ListShell({ children, className }: ListShellProps) {
  return (
    <div className={clsx('overflow-hidden rounded-lg border border-ui-border bg-ui-surface', className)}>
      {children}
    </div>
  )
}
