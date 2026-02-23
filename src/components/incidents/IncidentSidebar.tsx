import Link from 'next/link'
import { resolveIncident } from '@/lib/actions'
import { FormValidationUX } from '@/components/forms'
import { formatDate } from '@/lib/utils'

interface Props {
  incident: {
    id: string
    createdAt: Date
    date: Date
    resolvedAt: Date | null
    housingUnitId: string
    housingUnit: { code: string; address: string }
    reportedBy: { code: string } | null
    reportedById: string | null
    subject: { code: string } | null
    subjectId: string | null
    involvedResidents: Array<{
      id: string
      residentId: string
      role: string
      resident: { code: string }
    }>
    followUpCount: number
  }
}

export function IncidentSidebar({ incident }: Props) {

  return (
    <div className="space-y-6">
      {/* Location */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Ort
        </h2>
        <Link
          href={`/housing/${incident.housingUnitId}`}
          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
        >
          <span className="text-xl">🏠</span>
          <div>
            <p className="font-medium text-gray-900">
              {incident.housingUnit.code}
            </p>
            <p className="text-sm text-gray-500">
              {incident.housingUnit.address}
            </p>
          </div>
        </Link>
      </div>

      {/* People Involved */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Beteiligte
        </h2>
        <div className="space-y-3">
          {incident.reportedBy && (
            <Link
              href={`/residents/${incident.reportedById}`}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
            >
              <span className="text-lg">📢</span>
              <div>
                <p className="text-sm text-gray-500">Gemeldet von</p>
                <p className="font-medium text-gray-900">
                  {incident.reportedBy.code}
                </p>
              </div>
            </Link>
          )}

          {incident.subject && (
            <Link
              href={`/residents/${incident.subjectId}`}
              className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg hover:bg-amber-100"
            >
              <span className="text-lg">👤</span>
              <div>
                <p className="text-sm text-gray-500">Betrifft</p>
                <p className="font-medium text-amber-900">
                  {incident.subject.code}
                </p>
              </div>
            </Link>
          )}

          {incident.involvedResidents.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Weitere Beteiligte</p>
              {incident.involvedResidents.map((inv) => (
                <Link
                  key={inv.id}
                  href={`/residents/${inv.residentId}`}
                  className="flex items-center gap-3 p-2 bg-gray-50 rounded hover:bg-gray-100"
                >
                  <span className="font-medium text-gray-900">
                    {inv.resident.code}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({inv.role})
                  </span>
                </Link>
              ))}
            </div>
          )}

          {!incident.reportedBy && !incident.subject && incident.involvedResidents.length === 0 && (
            <p className="text-gray-500 text-sm">
              Keine Bewohner zugeordnet
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      {!incident.resolvedAt && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Aktionen
          </h2>
          <form id="incident-resolve-form" action={resolveIncident} className="space-y-4">
            <input type="hidden" name="incidentId" value={incident.id} />
            <div id="incident-resolve-validation-summary" className="hidden p-3 rounded border border-red-300 bg-red-50 text-red-800 text-sm" role="alert" />
            <FormValidationUX formId="incident-resolve-form" summaryId="incident-resolve-validation-summary" />
            <div>
              <label className="label">Lösung</label>
              <textarea
                name="resolution"
                rows={3}
                placeholder="Wie wurde der Vorfall gelöst?"
                className="input"
              />
            </div>
            <button type="submit" className="btn-primary w-full min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aoz-primary focus-visible:ring-offset-2">
              Als gelöst markieren
            </button>
          </form>
        </div>
      )}

      {/* Meta Info */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Details
        </h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">Erstellt</dt>
            <dd className="text-gray-900">
              {formatDate(incident.createdAt)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Vorfallsdatum</dt>
            <dd className="text-gray-900">{formatDate(incident.date)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Follow-ups</dt>
            <dd className="text-gray-900">{incident.followUpCount}</dd>
          </div>
          {incident.resolvedAt && (
            <div className="flex justify-between">
              <dt className="text-gray-500">Gelöst am</dt>
              <dd className="text-gray-900">
                {formatDate(incident.resolvedAt)}
              </dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  )
}
