import Link from 'next/link'
import { PORTAL_LABELS } from '@/lib/constants/labels'
import { ACTIVITIES, ACTIVITY_CATEGORIES } from '@/lib/config/activities'
import { DISPLAY_LIMITS } from '@/lib/config/thresholds'

const COST_BADGE: Record<string, { label: string; class: string }> = {
  free:    { label: PORTAL_LABELS.activities.costFree,    class: 'badge-active' },
  reduced: { label: PORTAL_LABELS.activities.costReduced, class: 'badge-pending' },
  paid:    { label: PORTAL_LABELS.activities.costPaid,    class: 'badge-info' },
}

const highlighted = ACTIVITIES.filter(a => a.highlight).slice(0, DISPLAY_LIMITS.dashboardItems)

export function PortalActivitiesCard() {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-gray-900">{PORTAL_LABELS.activities.dashboardTitle}</h2>
          <p className="text-xs text-gray-500">{PORTAL_LABELS.activities.dashboardSubtitle}</p>
        </div>
        <span className="text-2xl" aria-hidden="true">🌍</span>
      </div>

      <div className="space-y-3">
        {highlighted.map(activity => (
          <div key={activity.id} className="flex items-start gap-3">
            <span className="text-base mt-0.5 flex-shrink-0" aria-hidden="true">
              {ACTIVITY_CATEGORIES[activity.category].icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 leading-tight">{activity.title}</p>
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{activity.description}</p>
            </div>
            <span className={`badge ${COST_BADGE[activity.cost].class} flex-shrink-0`}>
              {COST_BADGE[activity.cost].label}
            </span>
          </div>
        ))}
      </div>

      <Link
        href="/portal/activities"
        className="mt-4 block w-full text-center btn btn-outline text-sm"
      >
        {PORTAL_LABELS.activities.dashboardCta}
      </Link>
    </div>
  )
}
