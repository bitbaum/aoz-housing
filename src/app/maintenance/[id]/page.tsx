import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { updateMaintenanceStatus, assignMaintenanceRequest } from '@/lib/actions'
import {
  MAINTENANCE_CATEGORY_LABELS,
  MAINTENANCE_CATEGORY_ICONS,
  MAINTENANCE_PRIORITY_LABELS,
  MAINTENANCE_PRIORITY_COLORS,
  MAINTENANCE_STATUS_LABELS,
  MAINTENANCE_STATUS_COLORS,
  getLabel,
} from '@/lib/constants'
import { formatDate, formatRelativeDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function MaintenanceDetailPage({ params }: Props) {
  const { id } = await params

  const request = await prisma.maintenanceRequest.findUnique({
    where: { id },
    include: {
      housingUnit: true,
      spot: true,
      reportedBy: { select: { id: true, code: true } },
    },
  })

  if (!request) {
    notFound()
  }

  const categoryIcon = MAINTENANCE_CATEGORY_ICONS[request.category] || '🔧'
  const priorityClass = MAINTENANCE_PRIORITY_COLORS[request.priority] || ''
  const statusClass = MAINTENANCE_STATUS_COLORS[request.status] || 'badge'
  const isActive = !['COMPLETED', 'CANCELLED'].includes(request.status)

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/maintenance"
          className="text-aoz-primary hover:underline text-sm"
        >
          &larr; Zurück zur Liste
        </Link>
        <div className="flex items-start justify-between mt-2">
          <div className="flex items-center gap-4">
            <span className="text-3xl">{categoryIcon}</span>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {request.title}
              </h1>
              <p className="text-gray-500">
                {getLabel(MAINTENANCE_CATEGORY_LABELS, request.category)} ·{' '}
                {request.housingUnit.code}
                {request.location && ` · ${request.location}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-sm px-3 py-1 rounded-full ${priorityClass}`}>
              {getLabel(MAINTENANCE_PRIORITY_LABELS, request.priority)}
            </span>
            <span className={`badge ${statusClass}`}>
              {getLabel(MAINTENANCE_STATUS_LABELS, request.status)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Beschreibung
            </h2>
            <p className="text-gray-600 whitespace-pre-wrap">
              {request.description}
            </p>
          </div>

          {/* Status Update Form */}
          {isActive && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Status aktualisieren
              </h2>
              <form action={updateMaintenanceStatus} className="space-y-4">
                <input type="hidden" name="requestId" value={request.id} />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Neuer Status</label>
                    <select name="status" className="input" defaultValue={request.status}>
                      <option value="OPEN">Offen</option>
                      <option value="ASSIGNED">Zugewiesen</option>
                      <option value="IN_PROGRESS">In Bearbeitung</option>
                      <option value="ON_HOLD">Wartend</option>
                      <option value="COMPLETED">Abgeschlossen</option>
                      <option value="CANCELLED">Abgebrochen</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Zugewiesen an</label>
                    <input
                      type="text"
                      name="assignedTo"
                      defaultValue={request.assignedTo || ''}
                      placeholder="Name des Mitarbeiters"
                      className="input"
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Lösung / Erledigte Arbeiten</label>
                  <textarea
                    name="resolution"
                    rows={3}
                    defaultValue={request.resolution || ''}
                    placeholder="Beschreibung der durchgeführten Arbeiten..."
                    className="input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Kosten (CHF)</label>
                    <input
                      type="number"
                      name="cost"
                      step="0.01"
                      defaultValue={request.cost || ''}
                      placeholder="0.00"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Notizen</label>
                    <input
                      type="text"
                      name="notes"
                      defaultValue={request.notes || ''}
                      placeholder="Interne Notizen..."
                      className="input"
                    />
                  </div>
                </div>

                <button type="submit" className="btn-primary">
                  Status aktualisieren
                </button>
              </form>
            </div>
          )}

          {/* Resolution */}
          {request.resolution && (
            <div className="card bg-green-50">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Lösung
              </h2>
              <p className="text-gray-600 whitespace-pre-wrap">
                {request.resolution}
              </p>
              {request.cost && (
                <p className="text-sm text-gray-500 mt-2">
                  Kosten: CHF {request.cost.toFixed(2)}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right column: Info */}
        <div className="space-y-6">
          {/* Location */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Ort
            </h2>
            <Link
              href={`/housing/${request.housingUnitId}`}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
            >
              <span className="text-xl">🏠</span>
              <div>
                <p className="font-medium text-gray-900">
                  {request.housingUnit.code}
                </p>
                <p className="text-sm text-gray-500">
                  {request.housingUnit.address}
                </p>
              </div>
            </Link>
            {request.spot && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Platz</p>
                <p className="font-medium text-gray-900">
                  {request.spot.label || request.spot.code}
                </p>
              </div>
            )}
            {request.location && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Standort</p>
                <p className="font-medium text-gray-900">{request.location}</p>
              </div>
            )}
          </div>

          {/* Reporter */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Gemeldet von
            </h2>
            {request.reportedBy ? (
              <Link
                href={`/residents/${request.reportedById}`}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
              >
                <span className="text-xl">👤</span>
                <p className="font-medium text-gray-900">
                  {request.reportedBy.code}
                </p>
              </Link>
            ) : request.reporterName ? (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-900">
                  {request.reporterName}
                </p>
              </div>
            ) : (
              <p className="text-gray-500">Nicht angegeben</p>
            )}
          </div>

          {/* Assignment */}
          {request.assignedTo && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Zugewiesen an
              </h2>
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🔧</span>
                  <p className="font-medium text-gray-900">
                    {request.assignedTo}
                  </p>
                </div>
                {request.assignedAt && (
                  <p className="text-sm text-gray-500 mt-1">
                    Seit {formatDate(request.assignedAt)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Zeitlinie
            </h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Erstellt</dt>
                <dd className="text-gray-900">{formatDate(request.createdAt)}</dd>
              </div>
              {request.assignedAt && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Zugewiesen</dt>
                  <dd className="text-gray-900">{formatDate(request.assignedAt)}</dd>
                </div>
              )}
              {request.startedAt && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Gestartet</dt>
                  <dd className="text-gray-900">{formatDate(request.startedAt)}</dd>
                </div>
              )}
              {request.completedAt && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Abgeschlossen</dt>
                  <dd className="text-gray-900">{formatDate(request.completedAt)}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Notes */}
          {request.notes && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Notizen
              </h2>
              <p className="text-sm text-gray-600">{request.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
