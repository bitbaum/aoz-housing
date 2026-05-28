import type { Metadata } from 'next'
import Link from 'next/link'
import { createActivity } from '@/lib/actions'
import { ActivityFormFields } from '@/components/activities/ActivityFormFields'
import { PageHeader } from '@/components/ui/Page'

export const metadata: Metadata = { title: 'Aktivität erstellen' }

export default function NewActivityPage() {
  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <PageHeader
          title="Aktivität erstellen"
          description="Neue Angebote bleiben als Entwurf verborgen, bis sie veröffentlicht werden."
          backHref="/activities"
          backLabel="Zurück"
        />
      </div>

      <form action={createActivity} className="card space-y-6">
        <ActivityFormFields />
        <div className="flex flex-wrap gap-3">
          <button type="submit" className="btn btn-primary">Speichern</button>
          <Link href="/activities" className="btn btn-outline">Abbrechen</Link>
        </div>
      </form>
    </div>
  )
}
