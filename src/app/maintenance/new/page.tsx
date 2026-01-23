import { prisma } from '@/lib/db'
import Link from 'next/link'
import { createMaintenanceRequest } from '@/lib/actions'
import {
  MAINTENANCE_CATEGORY_LABELS,
  MAINTENANCE_CATEGORY_ICONS,
  MAINTENANCE_PRIORITY_LABELS,
} from '@/lib/constants'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ unit?: string; spot?: string }>
}

export default async function NewMaintenanceRequestPage({ searchParams }: Props) {
  const params = await searchParams
  const preselectedUnitId = params.unit
  const preselectedSpotId = params.spot

  // Fetch housing units with their spots
  const housingUnits = await prisma.housingUnit.findMany({
    where: { status: { not: 'CLOSED' } },
    include: {
      spots: {
        where: { type: { not: 'ROOM' } },
        orderBy: { code: 'asc' },
      },
    },
    orderBy: { code: 'asc' },
  })

  // Fetch residents for reporter selection
  const residents = await prisma.resident.findMany({
    where: { status: { in: ['ACTIVE', 'PLACED'] } },
    select: { id: true, code: true },
    orderBy: { code: 'asc' },
  })

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href="/maintenance"
          className="text-aoz-primary hover:underline text-sm"
        >
          &larr; Zurück zur Liste
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">
          Neue Wartungsanfrage
        </h1>
      </div>

      <div className="card">
        <form action={createMaintenanceRequest} className="space-y-6">
          {/* Location Section */}
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-900">Ort</h2>
            <div className="grid grid-cols-2 gap-4">
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
            <div className="grid grid-cols-2 gap-4">
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
            <div className="grid grid-cols-2 gap-4">
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
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Link href="/maintenance" className="btn-outline">
              Abbrechen
            </Link>
            <button type="submit" className="btn-primary">
              Anfrage erstellen
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
