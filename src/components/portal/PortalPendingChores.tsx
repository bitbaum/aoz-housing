import Link from 'next/link'
import { DISPLAY_LIMITS } from '@/lib/config/thresholds'
import { getRequestTranslator } from '@/lib/i18n/request'

interface PendingChore {
  id: string
  title: string
  currentStatus: string
}

interface PortalPendingChoresProps {
  chores: PendingChore[]
}

export async function PortalPendingChores({ chores }: PortalPendingChoresProps) {
  const { t } = await getRequestTranslator()

  return (
    <div className="card mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-ui-text">{t('pendingChores.title')}</h2>
        <Link href="/portal/chores" className="inline-flex items-center min-h-[44px] px-1 text-sm text-brand-primary hover:underline">
          {t('dashboard.showAll')}
        </Link>
      </div>
      <div className="space-y-3">
        {chores.slice(0, DISPLAY_LIMITS.dashboardItems).map((task) => (
          <Link
            key={task.id}
            href={`/portal/chores/${task.id}`}
            className="flex items-center gap-3 p-3 bg-status-warning/10 rounded-lg hover:bg-status-warning/15 transition-colors"
          >
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-medium text-ui-text text-sm">{task.title}</p>
              <p className="text-sm text-ui-muted">
                {task.currentStatus === 'NEEDS_ATTENTION' ? t('pendingChores.needsAttention') : t('pendingChores.requestOpen')}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
