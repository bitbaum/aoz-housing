import type { Metadata } from 'next'
import Link from 'next/link'
import { createActivity } from '@/lib/actions'
import { ActivityFormFields } from '@/components/activities/ActivityFormFields'

export const metadata: Metadata = { title: 'Aktivität erstellen' }

export default function NewActivityPage() {
  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <Link href="/activities" className="text-sm text-aoz-primary hover:underline">
          Zurück
        </Link>
        <h1 className="mt-2 text-xl sm:text-2xl font-bold text-ui-text">Aktivität erstellen</h1>
        <p className="mt-1 text-sm text-ui-muted">
          Neue Angebote bleiben als Entwurf verborgen, bis sie veröffentlicht werden.
        </p>
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
