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
          Neue Unterkunft erstellen
        </h1>
        <p className="text-gray-500">
          Schritt 1 von 2: Grunddaten erfassen. Im nächsten Schritt fügen Sie Zimmer und Betten hinzu.
        </p>
      </div>

      {/* Process Indicator */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-aoz-primary text-white flex items-center justify-center text-sm font-medium">
            1
          </div>
          <span className="text-sm font-medium text-gray-900">Grunddaten</span>
        </div>
        <div className="flex-1 h-0.5 bg-gray-200" />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-medium">
            2
          </div>
          <span className="text-sm text-gray-500">Zimmer & Betten</span>
        </div>
      </div>

      <form action={createHousingUnit} className="space-y-6">
        <HousingFormFields />

        {/* Actions */}
        <div className="flex gap-4">
          <button type="submit" className="btn-primary">
            Weiter zu Zimmer & Betten →
          </button>
          <Link href="/housing" className="btn-outline">
            Abbrechen
          </Link>
        </div>
      </form>
    </div>
  )
}
