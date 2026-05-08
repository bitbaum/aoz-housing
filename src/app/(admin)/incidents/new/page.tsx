import Link from 'next/link'
import { prisma } from '@/lib/db'
import { createIncident } from '@/lib/actions'
import {
  INCIDENT_TYPE_LABELS,
  INCIDENT_CATEGORY_LABELS,
  INCIDENT_CATEGORY_ICONS,
  INCIDENT_SEVERITY_LABELS,
  INCIDENT_TYPES_BY_CATEGORY,
  UI_LABELS,
} from '@/lib/constants'
import { getSeverityRadioClass, getSeverityDotClass } from '@/lib/utils'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{
    unit?: string
    reporter?: string
    subject?: string
    quick?: string
    category?: string
    type?: string
    severity?: string
    description?: string
  }>
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

  const selectedCategory = params.category === 'SAFETY' ? 'SAFETY' : 'INTERPERSONAL'
  const selectedType = params.type || ''
  const selectedSeverity = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(params.severity || '')
    ? (params.severity as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL')
    : 'MEDIUM'
  const selectedDescription = params.description || ''

  const queryBase = new URLSearchParams()
  if (params.unit) queryBase.set('unit', params.unit)
  if (params.reporter) queryBase.set('reporter', params.reporter)
  if (params.subject) queryBase.set('subject', params.subject)

  const quickPresetHref = (preset: {
    quick: string
    category: 'INTERPERSONAL' | 'SAFETY'
    type: string
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    description: string
  }) => {
    const q = new URLSearchParams(queryBase)
    q.set('quick', preset.quick)
    q.set('category', preset.category)
    q.set('type', preset.type)
    q.set('severity', preset.severity)
    q.set('description', preset.description)
    return `/incidents/new?${q.toString()}`
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/incidents"
          className="text-aoz-primary hover:underline text-sm"
        >
          ← Zurück zur Übersicht
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mt-2">Neuer Vorfall</h1>
        <p className="text-gray-500">Dokumentieren Sie einen neuen Vorfall</p>
      </div>

      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Schnellerfassung</h2>
            <p className="text-sm text-gray-500">Typische Vorfälle mit einem Klick vorbefüllen</p>
          </div>
          {params.quick && (
            <Link href={`/incidents/new?${queryBase.toString()}`} className="text-sm text-gray-500 hover:text-gray-700">
              Preset zurücksetzen
            </Link>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href={quickPresetHref({
              quick: 'noise',
              category: 'INTERPERSONAL',
              type: 'NOISE_COMPLAINT',
              severity: 'MEDIUM',
              description: 'Lärmbeschwerde: Zeitpunkt, beteiligte Personen und Sofortmassnahmen dokumentieren.',
            })}
            className={`btn-outline min-h-[44px] inline-flex items-center ${params.quick === 'noise' ? 'bg-blue-100 border-blue-300 text-blue-700' : ''}`}
          >
            🔊 Lärmkonflikt
          </Link>
          <Link
            href={quickPresetHref({
              quick: 'aggression',
              category: 'INTERPERSONAL',
              type: 'VERBAL_ARGUMENT',
              severity: 'HIGH',
              description: 'Eskalation/verbaler Konflikt: Verlauf, Deeskalation und Sicherheitslage festhalten.',
            })}
            className={`btn-outline min-h-[44px] inline-flex items-center ${params.quick === 'aggression' ? 'bg-blue-100 border-blue-300 text-blue-700' : ''}`}
          >
            ⚠️ Eskalation
          </Link>
          <Link
            href={quickPresetHref({
              quick: 'safety',
              category: 'SAFETY',
              type: 'SAFETY_CONCERN',
              severity: 'HIGH',
              description: 'Sicherheitsbedenken: Risiko, Betroffene, sofortige Schutzmassnahmen und nächste Schritte notieren.',
            })}
            className={`btn-outline min-h-[44px] inline-flex items-center ${params.quick === 'safety' ? 'bg-blue-100 border-blue-300 text-blue-700' : ''}`}
          >
            🚨 Sicherheit
          </Link>
        </div>
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
                <option value="">{UI_LABELS.selectPlaceholder}</option>
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
                      defaultChecked={selectedCategory === key}
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
              <select name="type" required className="input" defaultValue={selectedType}>
                <option value="">{UI_LABELS.selectPlaceholder}</option>
                <optgroup label={INCIDENT_CATEGORY_LABELS.INTERPERSONAL}>
                  {interpersonalTypes.map((type) => (
                    <option key={type} value={type}>
                      {INCIDENT_TYPE_LABELS[type]}
                    </option>
                  ))}
                </optgroup>
                <optgroup label={INCIDENT_CATEGORY_LABELS.SAFETY}>
                  <option value="SAFETY_CONCERN">{INCIDENT_TYPE_LABELS.SAFETY_CONCERN}</option>
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
                  defaultChecked={selectedSeverity === key}
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
                defaultValue={selectedDescription}
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 -mx-4 px-4 py-3 sm:static sm:mx-0 sm:px-0 sm:py-0 bg-white/95 backdrop-blur border-t border-gray-200 sm:border-0 flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 z-20">
          <button type="submit" className="btn-primary w-full sm:w-auto min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aoz-primary focus-visible:ring-offset-2">
            Vorfall erfassen
          </button>
          <Link href="/incidents" className="btn-outline w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center">
            Abbrechen
          </Link>
        </div>
      </form>
    </div>
  )
}
