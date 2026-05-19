import type { Metadata } from 'next'
import Link from 'next/link'
import { StatCard } from '@/components/ui/Card'
import { ButtonLink } from '@/components/ui/Button'
import { EmptyState, ListShell, PageHeader, PageShell } from '@/components/ui/Page'
import {
  ACTIVITY_CATEGORY_ICONS,
  ACTIVITY_CATEGORY_LABELS,
  ACTIVITY_COST_BADGES,
  ACTIVITY_COST_LABELS,
  ACTIVITY_STATUS_BADGES,
  ACTIVITY_STATUS_LABELS,
  type ActivityStatus,
} from '@/lib/config/activities'
import { countActivities, listActivities } from '@/lib/data/activities'

export const metadata: Metadata = { title: 'Aktivitäten' }
export const dynamic = 'force-dynamic'

type Props = {
  searchParams: Promise<{ status?: string }>
}

export default async function ActivitiesAdminPage({ searchParams }: Props) {
  const { status } = await searchParams
  const statusFilter = status && status in ACTIVITY_STATUS_LABELS ? status as ActivityStatus : undefined

  const [total, published, drafts, highlighted, activities] = await Promise.all([
    countActivities(),
    countActivities({ status: 'PUBLISHED' }),
    countActivities({ status: 'DRAFT' }),
    countActivities({ highlightedPublished: true }),
    listActivities({ status: statusFilter }),
  ])

  return (
    <PageShell>
      <PageHeader
        title="Aktivitäten"
        description="Admin-gepflegte Angebote für das Bewohnerportal."
        actions={
          <ButtonLink href="/activities/new">
          Aktivität
          </ButtonLink>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Gesamt" value={total} />
        <StatCard label="Live" value={published} trend={published > 0 ? 'good' : undefined} />
        <StatCard label="Entwürfe" value={drafts} />
        <StatCard label="Hervorgehoben" value={highlighted} />
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterLink href="/activities" active={!statusFilter}>Alle</FilterLink>
        {Object.entries(ACTIVITY_STATUS_LABELS).map(([value, label]) => (
          <FilterLink key={value} href={`/activities?status=${value}`} active={statusFilter === value}>
            {label}
          </FilterLink>
        ))}
      </div>

      {activities.length === 0 ? (
        <EmptyState
          title="Keine Aktivitäten vorhanden."
          action={
            <ButtonLink href="/activities/new" variant="outline">
              Erste Aktivität erstellen
            </ButtonLink>
          }
        />
      ) : (
        <ListShell>
          <div className="divide-y divide-ui-border">
            {activities.map((activity) => {
              const Icon = ACTIVITY_CATEGORY_ICONS[activity.category]
              return (
                <div key={activity.id} className="px-4 py-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Icon className="h-4 w-4 text-aoz-primary" />
                        <Link href={`/activities/${activity.id}/edit`} className="font-semibold text-ui-text hover:text-aoz-primary">
                          {activity.title}
                        </Link>
                        <span className={`badge ${ACTIVITY_STATUS_BADGES[activity.status]}`}>
                          {ACTIVITY_STATUS_LABELS[activity.status]}
                        </span>
                        {activity.highlight ? <span className="badge badge-info">Portal</span> : null}
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-ui-muted">{activity.description}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-ui-muted">
                        <span>{ACTIVITY_CATEGORY_LABELS[activity.category]}</span>
                        <span className={`badge ${ACTIVITY_COST_BADGES[activity.cost]}`}>
                          {ACTIVITY_COST_LABELS[activity.cost]}
                        </span>
                        {activity.location ? <span>{activity.location}</span> : null}
                        {activity.schedule ? <span>{activity.schedule}</span> : null}
                      </div>
                    </div>
                    <ButtonLink href={`/activities/${activity.id}/edit`} variant="outline">
                      Bearbeiten
                    </ButtonLink>
                  </div>
                </div>
              )
            })}
          </div>
        </ListShell>
      )}
    </PageShell>
  )
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string
  active: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={`min-h-[40px] rounded-md px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? 'bg-ui-text text-ui-inverse'
          : 'bg-ui-subtle text-ui-muted hover:bg-ui-border'
      }`}
    >
      {children}
    </Link>
  )
}
