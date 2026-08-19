import Link from 'next/link'
import { Globe2, MapPin, Phone, Clock, ExternalLink } from 'lucide-react'
import { PORTAL_LABELS } from '@/lib/constants/labels'
import {
  ACTIVITY_CATEGORY_ICONS,
  ACTIVITY_CATEGORY_LABELS,
  ACTIVITY_COST_BADGES,
  ACTIVITY_COST_LABELS,
  type ActivityCategory,
} from '@/lib/config/activities'
import { listActivities } from '@/lib/data/activities'
import { PageHeader } from '@/components/ui/Page'
import { getRequestTranslator } from '@/lib/i18n/request'

export const dynamic = 'force-dynamic'

type Props = {
  searchParams: Promise<{ category?: string }>
}

export default async function ActivitiesPage({ searchParams }: Props) {
  const { category } = await searchParams
  const { t } = await getRequestTranslator()
  const selectedCategory = category && category in ACTIVITY_CATEGORY_LABELS
    ? category as ActivityCategory
    : undefined
  const now = new Date()

  const activities = await listActivities({
    publishedOnly: true,
    category: selectedCategory,
    activeOn: now,
  })

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <PageHeader
          title={t('activities.dashboardTitle')}
          description={t('activities.dashboardSubtitle')}
          backHref="/portal"
          backLabel={t('action.back')}
        />
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <CategoryLink href="/portal/activities" active={!selectedCategory}>
          {PORTAL_LABELS.activities.allCategories}
        </CategoryLink>
        {Object.entries(ACTIVITY_CATEGORY_LABELS).map(([value, label]) => {
          const Icon = ACTIVITY_CATEGORY_ICONS[value as ActivityCategory]
          return (
            <CategoryLink
              key={value}
              href={`/portal/activities?category=${value}`}
              active={selectedCategory === value}
            >
              <Icon className="h-4 w-4" />
              {label}
            </CategoryLink>
          )
        })}
      </div>

      {activities.length === 0 ? (
        <div className="card py-12 text-center">
          <Globe2 className="mx-auto h-8 w-8 text-ui-muted" />
          <p className="mt-3 text-ui-muted">{PORTAL_LABELS.activities.noResults}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = ACTIVITY_CATEGORY_ICONS[activity.category]
            return (
              <article key={activity.id} className="card">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Icon className="h-5 w-5 text-brand-primary" />
                    <h2 className="font-semibold text-ui-text">{activity.title}</h2>
                  </div>
                  <span className={`badge ${ACTIVITY_COST_BADGES[activity.cost]}`}>
                    {ACTIVITY_COST_LABELS[activity.cost]}
                  </span>
                </div>

                <p className="text-sm text-ui-muted mt-2">{activity.description}</p>

                {activity.costNote ? (
                  <p className="text-xs text-ui-muted mt-1 italic">{activity.costNote}</p>
                ) : null}

                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-ui-muted">
                  {activity.location ? (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" /> {activity.location}
                    </span>
                  ) : null}
                  {activity.schedule ? (
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" /> {activity.schedule}
                    </span>
                  ) : null}
                </div>

                {(activity.website || activity.phone) ? (
                  <div className="mt-4 flex flex-wrap gap-3">
                    {activity.website ? (
                      <a
                        href={activity.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline text-sm inline-flex items-center gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        {PORTAL_LABELS.activities.website}
                      </a>
                    ) : null}
                    {activity.phone ? (
                      <a
                        href={`tel:${activity.phone.replace(/\s/g, '')}`}
                        className="btn btn-outline text-sm inline-flex items-center gap-2"
                      >
                        <Phone className="h-4 w-4" />
                        {activity.phone}
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}

function CategoryLink({
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
      className={`min-h-[44px] inline-flex items-center gap-2 rounded-sm px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? 'bg-brand-primary text-ui-on-accent'
          : 'bg-ui-subtle text-ui-muted hover:bg-ui-border'
      }`}
    >
      {children}
    </Link>
  )
}
