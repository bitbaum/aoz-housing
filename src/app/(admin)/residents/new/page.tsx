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
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mt-2">
          Neuen Bewohner erfassen
        </h1>
        <p className="text-gray-500">
          Schritt 1 von 2: Profil erfassen. Danach finden wir passende Unterkünfte.
        </p>
      </div>

      {/* Process Indicator */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-aoz-primary text-white flex items-center justify-center text-sm font-medium">
            1
          </div>
          <span className="text-sm font-medium text-gray-900">Profil erfassen</span>
        </div>
        <div className="flex-1 h-0.5 bg-gray-200" />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-medium">
            2
          </div>
          <span className="text-sm text-gray-500">Unterkunft finden</span>
        </div>
      </div>

      <form action={createResident} className="space-y-6">
        <ResidentFormFields />

        {/* Actions */}
        <div className="sticky bottom-0 -mx-4 px-4 py-3 sm:static sm:mx-0 sm:px-0 sm:py-0 bg-white/95 backdrop-blur border-t border-gray-200 sm:border-0 flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 z-20">
          <button type="submit" className="btn-primary w-full sm:w-auto min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aoz-primary focus-visible:ring-offset-2">
            Weiter zum Matching →
          </button>
          <Link href="/residents" className="btn-outline w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center">
            Abbrechen
          </Link>
        </div>
      </form>
    </div>
  )
}
