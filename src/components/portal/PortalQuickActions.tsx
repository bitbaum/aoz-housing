import Link from 'next/link'
import type { ComponentType } from 'react'
import { ClipboardCheck, MessageSquareWarning, Settings2, Users } from 'lucide-react'
import { PORTAL_LABELS } from '@/lib/constants'

interface PortalQuickActionsProps {
  pendingChoresCount: number
}

export function PortalQuickActions({ pendingChoresCount }: PortalQuickActionsProps) {
  const L = PORTAL_LABELS.dashboard
  const primary = pendingChoresCount > 0
    ? {
        href: '/portal/chores',
        title: L.quickActions.chores.title,
        description: `${pendingChoresCount} ${pendingChoresCount === 1 ? L.prioritySections.now.taskSingular : L.prioritySections.now.taskPlural}`,
        icon: ClipboardCheck,
      }
    : {
        href: '/portal/preferences',
        title: L.quickActions.preferences.title,
        description: L.prioritySections.next.desc,
        icon: Settings2,
      }

  const PrimaryIcon = primary.icon
  const secondaryActions = [
    { href: '/portal/report', label: L.quickActions.report.title, icon: MessageSquareWarning },
    { href: '/portal/roommates', label: L.quickActions.roommates.title, icon: Users },
    { href: '/portal/preferences', label: L.quickActions.preferences.title, icon: Settings2 },
  ].filter((action) => action.href !== primary.href)

  return (
    <section className="mb-8 rounded-lg border border-ui-border bg-ui-surface p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <Link href={primary.href} className="group flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-aoz-primary text-ui-on-accent">
            <PrimaryIcon className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-semibold uppercase tracking-wide text-ui-muted">
              {L.prioritySections.now.heading}
            </span>
            <span className="mt-0.5 block font-semibold text-ui-text group-hover:text-aoz-primary">
              {primary.title}
            </span>
            <span className="mt-0.5 block text-sm text-ui-muted">{primary.description}</span>
          </span>
        </Link>

        <div className="grid grid-cols-2 gap-2 md:w-auto">
          {secondaryActions.map((action) => (
            <SecondaryAction key={action.href} {...action} />
          ))}
        </div>
      </div>
    </section>
  )
}

function SecondaryAction({
  href,
  label,
  icon: Icon,
}: {
  href: string
  label: string
  icon: ComponentType<{ className?: string }>
}) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-[44px] min-w-0 items-center justify-center gap-2 rounded-md bg-ui-subtle px-3 py-2 text-sm font-medium text-ui-muted transition-colors hover:bg-ui-border hover:text-ui-text"
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  )
}
