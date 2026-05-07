import Link from 'next/link'
import { PORTAL_LABELS } from '@/lib/constants'

interface PortalQuickActionsProps {
  pendingChoresCount: number
}

export function PortalQuickActions({ pendingChoresCount }: PortalQuickActionsProps) {
  const L = PORTAL_LABELS.dashboard

  const nowDesc = pendingChoresCount > 0
    ? `${pendingChoresCount} ${pendingChoresCount === 1 ? L.prioritySections.now.taskSingular : L.prioritySections.now.taskPlural}`
    : L.prioritySections.now.noTasks

  return (
    <>
      {/* Prioritized resident actions */}
      <div className="mb-8 space-y-3">
        <div className="p-3 rounded-lg border border-amber-200 bg-amber-50">
          <h2 className="text-sm font-semibold text-amber-900 uppercase tracking-wide">{L.prioritySections.now.heading}</h2>
          <p className="text-xs text-amber-700">{nowDesc}</p>
        </div>

        <div className="p-3 rounded-lg border border-blue-200 bg-blue-50">
          <h2 className="text-sm font-semibold text-blue-900 uppercase tracking-wide">{L.prioritySections.next.heading}</h2>
          <p className="text-xs text-blue-700">{L.prioritySections.next.desc}</p>
        </div>

        <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">{L.prioritySections.info.heading}</h2>
          <p className="text-xs text-gray-600">{L.prioritySections.info.desc}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <QuickActionCard
          href="/portal/chores"
          icon={L.quickActions.chores.icon}
          title={L.quickActions.chores.title}
          description={L.quickActions.chores.desc}
          priority={pendingChoresCount > 0 ? 'now' : 'next'}
        />
        <QuickActionCard
          href="/portal/report"
          icon={L.quickActions.report.icon}
          title={L.quickActions.report.title}
          description={L.quickActions.report.desc}
          priority="next"
        />
        <QuickActionCard
          href="/portal/roommates"
          icon={L.quickActions.roommates.icon}
          title={L.quickActions.roommates.title}
          description={L.quickActions.roommates.desc}
          priority="info"
        />
        <QuickActionCard
          href="/portal/preferences"
          icon={L.quickActions.preferences.icon}
          title={L.quickActions.preferences.title}
          description={L.quickActions.preferences.desc}
          priority="next"
        />
      </div>
    </>
  )
}

function QuickActionCard({
  href,
  icon,
  title,
  description,
  priority = 'info',
}: {
  href: string
  icon: string
  title: string
  description: string
  priority?: 'now' | 'next' | 'info'
}) {
  const priorityStyles = {
    now: 'border-2 border-amber-300 bg-amber-50/40',
    next: 'border-2 border-blue-200 bg-blue-50/30',
    info: 'border border-gray-200',
  }

  return (
    <Link
      href={href}
      className={`card-hover text-center ${priorityStyles[priority]}`}
    >
      <span className="text-4xl mb-3 block">{icon}</span>
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
    </Link>
  )
}
