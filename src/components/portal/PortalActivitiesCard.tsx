import Link from 'next/link'
import { Globe2 } from 'lucide-react'
import { PORTAL_LABELS } from '@/lib/constants/labels'
import {
  ACTIVITY_CATEGORY_ICONS,
  ACTIVITY_COST_BADGES,
  ACTIVITY_COST_LABELS,
  type ActivityRecord,
} from '@/lib/config/activities'

type PortalActivitiesCardProps = {
  activities: ActivityRecord[]
}

export function PortalActivitiesCard({ activities }: PortalActivitiesCardProps) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-ui-text">{PORTAL_LABELS.activities.dashboardTitle}</h2>
          <p className="text-sm text-ui-muted">{PORTAL_LABELS.activities.dashboardSubtitle}</p>
        </div>
        <Globe2 className="h-5 w-5 text-aoz-primary" />
      </div>

      {activities.length === 0 ? (
        <p className="rounded-md bg-ui-subtle px-3 py-4 text-sm text-ui-muted">
          {PORTAL_LABELS.activities.noResults}
        </p>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => {
            const Icon = ACTIVITY_CATEGORY_ICONS[activity.category]
            return (
              <div key={activity.id} className="flex items-start gap-3">
                <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-aoz-primary" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ui-text leading-tight">{activity.title}</p>
                  <p className="text-sm text-ui-muted mt-0.5 line-clamp-2">{activity.description}</p>
                </div>
                <span className={`badge ${ACTIVITY_COST_BADGES[activity.cost]} flex-shrink-0`}>
                  {ACTIVITY_COST_LABELS[activity.cost]}
                </span>
              </div>
            )
          })}
        </div>
      )}

      <Link
        href="/portal/activities"
        className="mt-4 block w-full text-center btn btn-outline text-sm"
      >
        {PORTAL_LABELS.activities.dashboardCta}
      </Link>
    </div>
  )
}
