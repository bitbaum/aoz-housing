import Link from 'next/link'
import { ResidentFormFields } from '@/components/forms'
import { createResident } from '@/lib/actions'

export const dynamic = 'force-dynamic'

export default function NewResidentPage() {
  return (
    <div>
      <div className="mb-6">
        <Link
          href="/residents"
          className="text-aoz-primary hover:underline text-sm"
        >
          ← Zurück zur Übersicht
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">
          Neuer Bewohner
        </h1>
        <p className="text-gray-500">
          Erfassen Sie die Informationen für die Kompatibilitätsanalyse
        </p>
      </div>

      <form action={createResident} className="space-y-6">
        <ResidentFormFields />

        {/* Actions */}
        <div className="flex gap-4">
          <button type="submit" className="btn-primary">
            Bewohner erfassen
          </button>
          <Link href="/residents" className="btn-outline">
            Abbrechen
          </Link>
        </div>
      </form>
    </div>
  )
}
