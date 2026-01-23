import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { addFollowUp, resolveIncident, clearFollowUpReminder } from '@/lib/actions'
import {
  INCIDENT_TYPE_LABELS,
  INCIDENT_CATEGORY_LABELS,
  INCIDENT_CATEGORY_ICONS,
  INCIDENT_SEVERITY_LABELS,
  FOLLOW_UP_PRIORITY_LABELS,
  FOLLOW_UP_PRIORITY_COLORS,
  getLabel,
} from '@/lib/constants'
import {
  getSeverityBorderClass,
  formatRelativeDate,
  formatDate,
} from '@/lib/utils'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function IncidentDetailPage({ params }: Props) {
  const { id } = await params

  const incident = await prisma.incident.findUnique({
    where: { id },
    include: {
      housingUnit: true,
      reportedBy: true,
      subject: true,
      involvedResidents: {
        include: { resident: true },
      },
      followUps: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!incident) {
    notFound()
  }

  const isOverdue = incident.nextFollowUpDate && incident.nextFollowUpDate < new Date() && !incident.resolvedAt

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/incidents"
          className="text-aoz-primary hover:underline text-sm"
        >
          &larr; Zurück zur Liste
        </Link>
        <div className="flex items-start justify-between mt-2">
          <div className="flex items-center gap-4">
            <span className="text-3xl">
              {INCIDENT_CATEGORY_ICONS[incident.category] || '💬'}
            </span>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {getLabel(INCIDENT_TYPE_LABELS, incident.type)}
              </h1>
              <p className="text-gray-500">
                {getLabel(INCIDENT_CATEGORY_LABELS, incident.category)} ·{' '}
                {getLabel(INCIDENT_SEVERITY_LABELS, incident.severity)} ·{' '}
                {formatDate(incident.date)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {incident.resolvedAt ? (
              <span className="badge badge-active">Gelöst</span>
            ) : (
              <span className="badge badge-pending">Offen</span>
            )}
          </div>
        </div>
      </div>

      {/* Follow-up Reminder Banner */}
      {isOverdue && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⏰</span>
              <div>
                <p className="font-semibold text-red-800">
                  Follow-up überfällig seit {formatRelativeDate(incident.nextFollowUpDate!)}
                </p>
                {incident.followUpPriority && (
                  <p className="text-sm text-red-600">
                    Priorität: {getLabel(FOLLOW_UP_PRIORITY_LABELS, incident.followUpPriority)}
                  </p>
                )}
              </div>
            </div>
            <form action={clearFollowUpReminder}>
              <input type="hidden" name="incidentId" value={incident.id} />
              <button type="submit" className="btn-outline text-sm">
                Erinnerung löschen
              </button>
            </form>
          </div>
        </div>
      )}

      {incident.nextFollowUpDate && !isOverdue && !incident.resolvedAt && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📅</span>
            <div>
              <p className="font-semibold text-blue-800">
                Nächste Follow-up: {formatDate(incident.nextFollowUpDate)}
              </p>
              {incident.followUpPriority && (
                <span className={`text-xs px-2 py-0.5 rounded ${FOLLOW_UP_PRIORITY_COLORS[incident.followUpPriority]}`}>
                  {getLabel(FOLLOW_UP_PRIORITY_LABELS, incident.followUpPriority)}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Details and Follow-ups */}
        <div className="lg:col-span-2 space-y-6">
          {/* Incident Details */}
          <div className={`card border-l-4 ${getSeverityBorderClass(incident.severity)}`}>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Beschreibung
            </h2>
            <p className="text-gray-600 whitespace-pre-wrap">
              {incident.description}
            </p>

            {incident.resolution && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <h3 className="font-medium text-gray-900 mb-2">Lösung</h3>
                <p className="text-gray-600">{incident.resolution}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Gelöst am {formatDate(incident.resolvedAt!)}
                </p>
              </div>
            )}
          </div>

          {/* Follow-ups Timeline */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Follow-ups ({incident.followUps.length})
              </h2>
            </div>

            {incident.followUps.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Noch keine Follow-ups dokumentiert
              </p>
            ) : (
              <div className="space-y-4">
                {incident.followUps.map((followUp, index) => (
                  <div
                    key={followUp.id}
                    className={`relative pl-6 pb-4 ${
                      index < incident.followUps.length - 1
                        ? 'border-l-2 border-gray-200'
                        : ''
                    }`}
                  >
                    {/* Timeline dot */}
                    <div className="absolute -left-2 top-0 w-4 h-4 bg-aoz-primary rounded-full border-2 border-white" />

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-medium text-gray-900">
                          {followUp.action}
                        </p>
                        <span className="text-sm text-gray-500">
                          {formatRelativeDate(followUp.createdAt)}
                        </span>
                      </div>

                      {followUp.notes && (
                        <p className="text-sm text-gray-600 mb-2">
                          {followUp.notes}
                        </p>
                      )}

                      {followUp.outcome && (
                        <p className="text-sm text-green-700 bg-green-50 px-2 py-1 rounded">
                          Ergebnis: {followUp.outcome}
                        </p>
                      )}

                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        {followUp.staffName && (
                          <span>👤 {followUp.staffName}</span>
                        )}
                        {followUp.scheduledNextDate && (
                          <span>📅 Nächste: {formatDate(followUp.scheduledNextDate)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Follow-up Form */}
            {!incident.resolvedAt && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-medium text-gray-900 mb-4">
                  Neues Follow-up hinzufügen
                </h3>
                <form action={addFollowUp} className="space-y-4">
                  <input type="hidden" name="incidentId" value={incident.id} />

                  <div>
                    <label className="label">Aktion/Massnahme *</label>
                    <input
                      type="text"
                      name="action"
                      required
                      placeholder="z.B. Gespräch mit Bewohner geführt"
                      className="input"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Notizen</label>
                      <textarea
                        name="notes"
                        rows={2}
                        placeholder="Details zur Massnahme..."
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="label">Ergebnis</label>
                      <textarea
                        name="outcome"
                        rows={2}
                        placeholder="Was kam dabei heraus?"
                        className="input"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="label">Mitarbeiter</label>
                      <input
                        type="text"
                        name="staffName"
                        placeholder="Name"
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="label">Nächste Follow-up</label>
                      <input
                        type="date"
                        name="scheduledNextDate"
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="label">Priorität</label>
                      <select name="followUpPriority" className="input">
                        <option value="">Keine</option>
                        {Object.entries(FOLLOW_UP_PRIORITY_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>
                            {label.split(' (')[0]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button type="submit" className="btn-primary">
                    Follow-up hinzufügen
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Info and Actions */}
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
              <form action={resolveIncident} className="space-y-4">
                <input type="hidden" name="incidentId" value={incident.id} />
                <div>
                  <label className="label">Lösung</label>
                  <textarea
                    name="resolution"
                    rows={3}
                    placeholder="Wie wurde der Vorfall gelöst?"
                    className="input"
                  />
                </div>
                <button type="submit" className="btn-primary w-full">
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
                <dd className="text-gray-900">{incident.followUps.length}</dd>
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
      </div>
    </div>
  )
}
