import Link from 'next/link'
import { DISPLAY_LIMITS } from '@/lib/config/thresholds'
import { PORTAL_LABELS, CHORE_LABELS } from '@/lib/constants'

interface PendingChore {
  id: string
  title: string
  currentStatus: string
}

interface PortalPendingChoresProps {
  chores: PendingChore[]
}

export function PortalPendingChores({ chores }: PortalPendingChoresProps) {
  return (
    <div className="card mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">{PORTAL_LABELS.pendingChores.title}</h2>
        <Link href="/portal/chores" className="text-sm text-aoz-primary hover:underline">
          {PORTAL_LABELS.dashboard.showAll}
        </Link>
      </div>
      <div className="space-y-3">
        {chores.slice(0, DISPLAY_LIMITS.dashboardItems).map((task) => (
          <Link
            key={task.id}
            href={`/portal/chores/${task.id}`}
            className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
          >
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-medium text-gray-900 text-sm">{task.title}</p>
              <p className="text-xs text-gray-500">
                {task.currentStatus === 'NEEDS_ATTENTION' ? CHORE_LABELS.statNeedsAttention : PORTAL_LABELS.pendingChores.requestOpen}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
