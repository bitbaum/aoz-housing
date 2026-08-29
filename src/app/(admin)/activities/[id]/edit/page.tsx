import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { archiveActivity, publishActivity, updateActivity } from '@/lib/actions'
import { ActivityFormFields } from '@/components/activities/ActivityFormFields'
import { PageHeader } from '@/components/ui/Page'
import { ACTIVITY_STATUS_LABELS } from '@/lib/config/activities'
import { getActivityById } from '@/lib/data/activities'
import { ACTIVITIES_ADMIN_LABELS } from '@/lib/constants'
import { requirePermission } from '@/lib/auth'

export const metadata: Metadata = { title: ACTIVITIES_ADMIN_LABELS.editTitle }
export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ id: string }>
}

export default async function EditActivityPage({ params }: Props) {
  await requirePermission('activities:write')
  const { id } = await params
  const activity = await getActivityById(id)

  if (!activity) notFound()

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <PageHeader
          title={ACTIVITIES_ADMIN_LABELS.editTitle}
          description={`Status: ${ACTIVITY_STATUS_LABELS[activity.status]}`}
          backHref="/activities"
          backLabel={ACTIVITIES_ADMIN_LABELS.backLabel}
          actions={
            <>
              {activity.status !== 'PUBLISHED' ? (
                <form action={publishActivity.bind(null, activity.id)}>
                  <button type="submit" className="btn btn-outline text-sm">
                    {ACTIVITIES_ADMIN_LABELS.publish}
                  </button>
                </form>
              ) : null}
              {activity.status !== 'ARCHIVED' ? (
                <form action={archiveActivity.bind(null, activity.id)}>
                  <button type="submit" className="btn btn-outline text-sm">
                    {ACTIVITIES_ADMIN_LABELS.archive}
                  </button>
                </form>
              ) : null}
            </>
          }
        />
      </div>

      <form action={updateActivity} className="card space-y-6">
        <ActivityFormFields activity={activity} />
        <div className="flex flex-wrap gap-3">
          <button type="submit" className="btn btn-primary">
            {ACTIVITIES_ADMIN_LABELS.save}
          </button>
          <Link href="/activities" className="btn btn-outline">
            {ACTIVITIES_ADMIN_LABELS.cancel}
          </Link>
        </div>
      </form>
    </div>
  )
}
