import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { archiveActivity, publishActivity, updateActivity } from '@/lib/actions'
import { ActivityFormFields } from '@/components/activities/ActivityFormFields'
import { PageHeader } from '@/components/ui/Page'
import { ACTIVITY_STATUS_LABELS } from '@/lib/config/activities'
import { getActivityById } from '@/lib/data/activities'

export const metadata: Metadata = { title: 'Aktivität bearbeiten' }
export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ id: string }>
}

export default async function EditActivityPage({ params }: Props) {
  const { id } = await params
  const activity = await getActivityById(id)

  if (!activity) notFound()

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <PageHeader
          title="Aktivität bearbeiten"
          description={`Status: ${ACTIVITY_STATUS_LABELS[activity.status]}`}
          backHref="/activities"
          backLabel="Zurück"
          actions={
            <>
              {activity.status !== 'PUBLISHED' ? (
                <form action={publishActivity.bind(null, activity.id)}>
                  <button type="submit" className="btn btn-outline text-sm">Veröffentlichen</button>
                </form>
              ) : null}
              {activity.status !== 'ARCHIVED' ? (
                <form action={archiveActivity.bind(null, activity.id)}>
                  <button type="submit" className="btn btn-outline text-sm">Archivieren</button>
                </form>
              ) : null}
            </>
          }
        />
      </div>

      <form action={updateActivity} className="card space-y-6">
        <ActivityFormFields activity={activity} />
        <div className="flex flex-wrap gap-3">
          <button type="submit" className="btn btn-primary">Speichern</button>
          <Link href="/activities" className="btn btn-outline">Abbrechen</Link>
        </div>
      </form>
    </div>
  )
}
