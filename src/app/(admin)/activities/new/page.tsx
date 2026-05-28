import type { Metadata } from 'next'
import Link from 'next/link'
import { createActivity } from '@/lib/actions'
import { ActivityFormFields } from '@/components/activities/ActivityFormFields'
import { PageHeader } from '@/components/ui/Page'
import { ACTIVITIES_ADMIN_LABELS } from '@/lib/constants'

export const metadata: Metadata = { title: ACTIVITIES_ADMIN_LABELS.createTitle }

export default function NewActivityPage() {
  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <PageHeader
          title={ACTIVITIES_ADMIN_LABELS.createTitle}
          description={ACTIVITIES_ADMIN_LABELS.createDescription}
          backHref="/activities"
          backLabel={ACTIVITIES_ADMIN_LABELS.backLabel}
        />
      </div>

      <form action={createActivity} className="card space-y-6">
        <ActivityFormFields />
        <div className="flex flex-wrap gap-3">
          <button type="submit" className="btn btn-primary">{ACTIVITIES_ADMIN_LABELS.save}</button>
          <Link href="/activities" className="btn btn-outline">{ACTIVITIES_ADMIN_LABELS.cancel}</Link>
        </div>
      </form>
    </div>
  )
}
