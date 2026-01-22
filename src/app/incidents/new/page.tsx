import Link from 'next/link'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import {
  INCIDENT_TYPE_LABELS,
  INCIDENT_CATEGORY_LABELS,
  INCIDENT_SEVERITY_LABELS,
} from '@/lib/constants'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ unit?: string; resident?: string }>
}

async function createIncident(formData: FormData) {
  'use server'

  const housingUnitId = formData.get('housingUnitId') as string
  const residentId = (formData.get('residentId') as string) || null
  const category = formData.get('category') as string
  const type = formData.get('type') as string
  const severity = formData.get('severity') as string
  const description = formData.get('description') as string
  const date = formData.get('date') as string

  await prisma.incident.create({
    data: {
      housingUnitId,
      residentId,
      category: category as any,
      type: type as any,
      severity: severity as any,
      description,
      date: new Date(date),
    },
  })

  redirect('/incidents')
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

  const interpersonalTypes = [
    'NOISE_COMPLAINT',
    'CLEANLINESS_DISPUTE',
    'PERSONAL_CONFLICT',
    'CULTURAL_FRICTION',
    'SPACE_DISPUTE',
    'SCHEDULE_CONFLICT',
    'SAFETY_CONCERN',
  ]

  const maintenanceTypes = [
    'PLUMBING',
    'ELECTRICAL',
    'HEATING_COOLING',
    'APPLIANCE',
    'STRUCTURAL',
    'PEST_CONTROL',
    'SECURITY_SYSTEM',
    'GENERAL_MAINTENANCE',
  ]

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
        {/* Location */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ort</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <label className="label">Betroffener Bewohner</label>
              <select
                name="residentId"
                defaultValue={params.resident || ''}
                className="input"
              >
                <option value="">Keiner / Unbekannt</option>
                {residents.map((resident) => (
                  <option key={resident.id} value={resident.id}>
                    {resident.code}
                  </option>
                ))}
              </select>
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
                {Object.entries(INCIDENT_CATEGORY_LABELS).map(
                  ([key, label]) => (
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
                          {key === 'MAINTENANCE'
                            ? '🔧'
                            : key === 'SAFETY'
                            ? '⚠️'
                            : '💬'}
                        </span>
                        <p className="font-medium text-gray-900 mt-2">
                          {label}
                        </p>
                      </div>
                    </label>
                  )
                )}
              </div>
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
                <optgroup label="Wartung">
                  {maintenanceTypes.map((type) => (
                    <option key={type} value={type}>
                      {INCIDENT_TYPE_LABELS[type]}
                    </option>
                  ))}
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
            {Object.entries(INCIDENT_SEVERITY_LABELS).map(([key, label]) => {
              const colors: Record<string, string> = {
                LOW: 'peer-checked:border-gray-500 peer-checked:bg-gray-50',
                MEDIUM:
                  'peer-checked:border-yellow-500 peer-checked:bg-yellow-50',
                HIGH: 'peer-checked:border-orange-500 peer-checked:bg-orange-50',
                CRITICAL: 'peer-checked:border-red-500 peer-checked:bg-red-50',
              }
              const dotColors: Record<string, string> = {
                LOW: 'bg-gray-400',
                MEDIUM: 'bg-yellow-500',
                HIGH: 'bg-orange-500',
                CRITICAL: 'bg-red-500',
              }

              return (
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
                    className={`p-4 text-center rounded-lg border-2 border-gray-200 transition-colors ${colors[key]}`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full mx-auto ${dotColors[key]}`}
                    />
                    <p className="font-medium text-gray-900 mt-2">{label}</p>
                  </div>
                </label>
              )
            })}
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
