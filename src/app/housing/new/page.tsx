import Link from 'next/link'
import { HousingFormFields } from '@/components/forms'
import { createHousingUnit } from '@/lib/actions'

export const dynamic = 'force-dynamic'

export default function NewHousingPage() {
  return (
    <div>
      <div className="mb-6">
        <Link
          href="/housing"
          className="text-aoz-primary hover:underline text-sm"
        >
          ← Zurück zur Übersicht
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">
          Neue Unterkunft
        </h1>
        <p className="text-gray-500">
          Erfassen Sie eine neue Unterkunft im System
        </p>
      </div>

      <form action={createHousingUnit} className="space-y-6">
        <HousingFormFields />

        {/* Actions */}
        <div className="flex gap-4">
          <button type="submit" className="btn-primary">
            Unterkunft erstellen
          </button>
          <Link href="/housing" className="btn-outline">
            Abbrechen
          </Link>
        </div>
      </form>
    </div>
  )
}
