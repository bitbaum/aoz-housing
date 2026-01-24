import Link from 'next/link'
import { prisma } from '@/lib/db'
import { createIncident } from '@/lib/actions'
import {
  INCIDENT_TYPE_LABELS,
  INCIDENT_CATEGORY_LABELS,
  INCIDENT_CATEGORY_ICONS,
  INCIDENT_SEVERITY_LABELS,
  INCIDENT_TYPES_BY_CATEGORY,
} from '@/lib/constants'
import { getSeverityRadioClass, getSeverityDotClass } from '@/lib/utils'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ unit?: string; reporter?: string; subject?: string }>
}

export default async function NewIncidentPage({ searchParams }: Props) {
  const params = await searchParams

  const [units, residents] = await Promise.all([
    prisma.housingUnit.findMany({
      where: { status: { not: 'CLOSED' } },
      orderBy: { code: 'asc' },
    }),
    prisma.resident.findMany({
      where: { status: { in: ['ACTIVE', 'PLACED'] } },
      orderBy: { code: 'asc' },
    }),
  ])

  const interpersonalTypes = INCIDENT_TYPES_BY_CATEGORY.INTERPERSONAL
  // Note: Maintenance requests go to /maintenance, not incidents

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/incidents"
          className="text-aoz-primary hover:underline text-sm"
        >
          ← Zurück zur Übersicht
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Neuer Vorfall</h1>
        <p className="text-gray-500">Dokumentieren Sie einen neuen Vorfall</p>
      </div>

      <form action={createIncident} className="space-y-6">
        {/* Location & Attribution */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ort & Beteiligte</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Unterkunft *</label>
              <select
                name="housingUnitId"
                required
                defaultValue={params.unit || ''}
                className="input"
              >
                <option value="">Bitte wählen</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.code} - {unit.address}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Gemeldet von</label>
              <select
                name="reportedById"
                defaultValue={params.reporter || ''}
                className="input"
              >
                <option value="">Unbekannt / Extern</option>
                {residents.map((resident) => (
                  <option key={resident.id} value={resident.id}>
                    {resident.code}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Wer hat den Vorfall gemeldet?</p>
            </div>
            <div>
              <label className="label">Betrifft</label>
              <select
                name="subjectId"
                defaultValue={params.subject || ''}
                className="input"
              >
                <option value="">Keiner / Unbekannt</option>
                {residents.map((resident) => (
                  <option key={resident.id} value={resident.id}>
                    {resident.code}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Wen betrifft der Vorfall?</p>
            </div>
          </div>
        </div>

        {/* Category & Type */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Kategorie & Art
          </h2>
          <div className="space-y-4">
            <div>
              <label className="label">Kategorie *</label>
              <div className="flex gap-3">
                {/* Only INTERPERSONAL and SAFETY - Maintenance goes to /maintenance */}
                {(['INTERPERSONAL', 'SAFETY'] as const).map((key) => (
                  <label key={key} className="flex-1 cursor-pointer">
                    <input
                      type="radio"
                      name="category"
                      value={key}
                      required
                      defaultChecked={key === 'INTERPERSONAL'}
                      className="sr-only peer"
                    />
                    <div className="p-4 text-center rounded-lg border-2 border-gray-200 peer-checked:border-aoz-primary peer-checked:bg-aoz-primary/5 transition-colors">
                      <span className="text-2xl">
                        {INCIDENT_CATEGORY_ICONS[key] || '💬'}
                      </span>
                      <p className="font-medium text-gray-900 mt-2">
                        {INCIDENT_CATEGORY_LABELS[key]}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Für Wartungsanfragen nutzen Sie bitte <a href="/maintenance/new" className="text-aoz-primary hover:underline">Neue Wartungsanfrage</a>
              </p>
            </div>

            <div>
              <label className="label">Art des Vorfalls *</label>
              <select name="type" required className="input">
                <option value="">Bitte wählen</option>
                <optgroup label="Zwischenmenschlich">
                  {interpersonalTypes.map((type) => (
                    <option key={type} value={type}>
                      {INCIDENT_TYPE_LABELS[type]}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Sicherheit">
                  <option value="SAFETY_CONCERN">Sicherheitsbedenken</option>
                </optgroup>
                <option value="OTHER">Sonstiges</option>
              </select>
            </div>
          </div>
        </div>

        {/* Severity */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Schweregrad
          </h2>
          <div className="flex gap-3">
            {Object.entries(INCIDENT_SEVERITY_LABELS).map(([key, label]) => (
              <label key={key} className="flex-1 cursor-pointer">
                <input
                  type="radio"
                  name="severity"
                  value={key}
                  required
                  defaultChecked={key === 'MEDIUM'}
                  className="sr-only peer"
                />
                <div
                  className={`p-4 text-center rounded-lg border-2 border-gray-200 transition-colors ${getSeverityRadioClass(key)}`}
                >
                  <div
                    className={`w-4 h-4 rounded-full mx-auto ${getSeverityDotClass(key)}`}
                  />
                  <p className="font-medium text-gray-900 mt-2">{label}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Details</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Datum *</label>
              <input
                type="date"
                name="date"
                required
                defaultValue={new Date().toISOString().split('T')[0]}
                className="input"
              />
            </div>
            <div>
              <label className="label">Beschreibung *</label>
              <textarea
                name="description"
                required
                rows={4}
                placeholder="Beschreiben Sie den Vorfall..."
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button type="submit" className="btn-primary">
            Vorfall erfassen
          </button>
          <Link href="/incidents" className="btn-outline">
            Abbrechen
          </Link>
        </div>
      </form>
    </div>
  )
}
