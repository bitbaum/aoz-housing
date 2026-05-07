import { prisma } from '@/lib/db'
import Link from 'next/link'
import { createMaintenanceRequest } from '@/lib/actions'
import {
  MAINTENANCE_CATEGORY_LABELS,
  MAINTENANCE_CATEGORY_ICONS,
  MAINTENANCE_PRIORITY_LABELS,
} from '@/lib/constants'
import { FormValidationUX } from '@/components/forms'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ unit?: string; spot?: string }>
}

export default async function NewMaintenanceRequestPage({ searchParams }: Props) {
  const params = await searchParams
  const preselectedUnitId = params.unit
  const preselectedSpotId = params.spot

  const [housingUnits, residents] = await Promise.all([
    prisma.housingUnit.findMany({
      where: { status: { not: 'CLOSED' } },
      include: {
        spots: {
          where: { type: { not: 'ROOM' } },
          orderBy: { code: 'asc' },
        },
      },
      orderBy: { code: 'asc' },
    }),
    prisma.resident.findMany({
      where: { status: { in: ['ACTIVE', 'PLACED'] } },
      select: { id: true, code: true },
      orderBy: { code: 'asc' },
    }),
  ])

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href="/maintenance"
          className="text-aoz-primary hover:underline text-sm"
        >
          &larr; Zurück zur Liste
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mt-2">
          Neue Wartungsanfrage
        </h1>
      </div>

      <div className="card">
        <form id="maintenance-new-form" action={createMaintenanceRequest} className="space-y-6">
          <div id="maintenance-new-validation-summary" className="hidden p-3 rounded border border-red-300 bg-red-50 text-red-800 text-sm" role="alert" />
          <FormValidationUX formId="maintenance-new-form" summaryId="maintenance-new-validation-summary" />

          {/* Location Section */}
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-900">Ort</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Unterkunft *</label>
                <select
                  name="housingUnitId"
                  required
                  className="input"
                  defaultValue={preselectedUnitId || ''}
                >
                  <option value="">Bitte wählen</option>
                  {housingUnits.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.code} - {unit.address}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Spezifischer Platz</label>
                <select
                  name="spotId"
                  className="input"
                  defaultValue={preselectedSpotId || ''}
                >
                  <option value="">Allgemein / Nicht zugeordnet</option>
                  {housingUnits.flatMap((unit) =>
                    unit.spots.map((spot) => (
                      <option key={spot.id} value={spot.id}>
                        {unit.code} → {spot.label || spot.code}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Standort-Details</label>
              <input
                type="text"
                name="location"
                placeholder="z.B. Badezimmer, Küche, Flur..."
                className="input"
              />
            </div>
          </div>

          {/* Request Details */}
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-900">Anfrage</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Kategorie *</label>
                <select name="category" required className="input">
                  <option value="">Bitte wählen</option>
                  {Object.entries(MAINTENANCE_CATEGORY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {MAINTENANCE_CATEGORY_ICONS[key]} {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Priorität *</label>
                <select name="priority" required className="input" defaultValue="NORMAL">
                  {Object.entries(MAINTENANCE_PRIORITY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Titel *</label>
              <input
                type="text"
                name="title"
                required
                placeholder="Kurze Beschreibung des Problems"
                className="input"
              />
            </div>
            <div>
              <label className="label">Beschreibung *</label>
              <textarea
                name="description"
                required
                rows={4}
                placeholder="Detaillierte Beschreibung des Problems..."
                className="input"
              />
            </div>
          </div>

          {/* Reporter */}
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-900">Gemeldet von</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Bewohner</label>
                <select name="reportedById" className="input">
                  <option value="">Nicht zugeordnet</option>
                  {residents.map((resident) => (
                    <option key={resident.id} value={resident.id}>
                      {resident.code}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Oder Name eingeben</label>
                <input
                  type="text"
                  name="reporterName"
                  placeholder="z.B. Hauswart, Nachbar..."
                  className="input"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="sticky bottom-0 -mx-4 px-4 py-3 sm:static sm:mx-0 sm:px-0 sm:py-0 bg-white/95 backdrop-blur border-t border-gray-200 sm:border-0 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 z-20">
            <Link href="/maintenance" className="btn-outline w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center">
              Abbrechen
            </Link>
            <button type="submit" className="btn-primary w-full sm:w-auto min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aoz-primary focus-visible:ring-offset-2">
              Anfrage erstellen
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
