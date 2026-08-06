import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { updateMaintenanceStatus } from '@/lib/actions'
import { FormValidationUX } from '@/components/forms'
import { SubmitButton } from '@/components/ui'
import {
  MAINTENANCE_CATEGORY_LABELS,
  MAINTENANCE_CATEGORY_ICONS,
  MAINTENANCE_PRIORITY_LABELS,
  MAINTENANCE_PRIORITY_COLORS,
  MAINTENANCE_STATUS_LABELS,
  MAINTENANCE_STATUS_COLORS,
  MAINTENANCE_PAGE_LABELS,
  getLabel,
} from '@/lib/constants'
import { formatDate } from '@/lib/utils'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const request = await prisma.maintenanceRequest.findUnique({ where: { id }, select: { category: true } })
  return { title: request ? (MAINTENANCE_CATEGORY_LABELS[request.category as keyof typeof MAINTENANCE_CATEGORY_LABELS] ?? 'Wartungsanfrage') : 'Wartungsanfrage' }
}

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
          className="inline-flex items-center min-h-[44px] px-1 -ml-1 text-sm text-brand-primary hover:underline"
        >
          {MAINTENANCE_PAGE_LABELS.backToList}
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mt-2">
          <div className="flex items-center gap-4">
            <span className="text-3xl">{categoryIcon}</span>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-ui-text">
                {request.title}
              </h1>
              <p className="text-ui-muted">
                {getLabel(MAINTENANCE_CATEGORY_LABELS, request.category)} ·{' '}
                {request.housingUnit.code}
                {request.location && ` · ${request.location}`}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
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
            <h2 className="text-lg font-semibold text-ui-text mb-4">
              {MAINTENANCE_PAGE_LABELS.descriptionTitle}
            </h2>
            <p className="text-ui-muted whitespace-pre-wrap">
              {request.description}
            </p>
          </div>

          {/* Status Update Form */}
          {isActive && (
            <div className="card">
              <h2 className="text-lg font-semibold text-ui-text mb-4">
                {MAINTENANCE_PAGE_LABELS.updateStatusTitle}
              </h2>
              <form id="maintenance-status-form" action={updateMaintenanceStatus} className="space-y-4">
                <input type="hidden" name="requestId" value={request.id} />
                <div id="maintenance-status-validation-summary" className="hidden alert-error" role="alert" />
                <FormValidationUX formId="maintenance-status-form" summaryId="maintenance-status-validation-summary" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">{MAINTENANCE_PAGE_LABELS.fieldNewStatus}</label>
                    <select name="status" className="input" defaultValue={request.status}>
                      {Object.entries(MAINTENANCE_STATUS_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">{MAINTENANCE_PAGE_LABELS.fieldAssignedTo}</label>
                    <input
                      type="text"
                      name="assignedTo"
                      defaultValue={request.assignedTo || ''}
                      placeholder={MAINTENANCE_PAGE_LABELS.fieldAssignedPlaceholder}
                      className="input"
                    />
                  </div>
                </div>

                <div>
                  <label className="label">{MAINTENANCE_PAGE_LABELS.fieldResolution}</label>
                  <textarea
                    name="resolution"
                    rows={3}
                    defaultValue={request.resolution || ''}
                    placeholder={MAINTENANCE_PAGE_LABELS.fieldResolutionPlaceholder}
                    className="input"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">{MAINTENANCE_PAGE_LABELS.fieldCost}</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      name="cost"
                      step="0.01"
                      defaultValue={request.cost || ''}
                      placeholder="0.00"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">{MAINTENANCE_PAGE_LABELS.fieldNotes}</label>
                    <input
                      type="text"
                      name="notes"
                      defaultValue={request.notes || ''}
                      placeholder={MAINTENANCE_PAGE_LABELS.fieldNotesPlaceholder}
                      className="input"
                    />
                  </div>
                </div>

                <SubmitButton className="btn-primary w-full sm:w-auto min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-wait">
                  {MAINTENANCE_PAGE_LABELS.updateStatusBtn}
                </SubmitButton>
              </form>
            </div>
          )}

          {/* Resolution */}
          {request.resolution && (
            <div className="card bg-status-success/10">
              <h2 className="text-lg font-semibold text-ui-text mb-4">
                {MAINTENANCE_PAGE_LABELS.resolutionTitle}
              </h2>
              <p className="text-ui-muted whitespace-pre-wrap">
                {request.resolution}
              </p>
              {request.cost && (
                <p className="text-sm text-ui-muted mt-2">
                  {MAINTENANCE_PAGE_LABELS.costPrefix}{request.cost.toFixed(2)}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right column: Info */}
        <div className="space-y-6">
          {/* Location */}
          <div className="card">
            <h2 className="text-lg font-semibold text-ui-text mb-4">
              {MAINTENANCE_PAGE_LABELS.locationTitle}
            </h2>
            <Link
              href={`/housing/${request.housingUnitId}`}
              className="flex items-center gap-3 p-3 bg-ui-subtle rounded-lg hover:bg-ui-subtle"
            >
              <span className="text-xl">🏠</span>
              <div>
                <p className="font-medium text-ui-text">
                  {request.housingUnit.code}
                </p>
                <p className="text-sm text-ui-muted">
                  {request.housingUnit.address}
                </p>
              </div>
            </Link>
            {request.spot && (
              <div className="mt-3 p-3 bg-ui-subtle rounded-lg">
                <p className="text-sm text-ui-muted">{MAINTENANCE_PAGE_LABELS.spotLabel}</p>
                <p className="font-medium text-ui-text">
                  {request.spot.label || request.spot.code}
                </p>
              </div>
            )}
            {request.location && (
              <div className="mt-3 p-3 bg-ui-subtle rounded-lg">
                <p className="text-sm text-ui-muted">{MAINTENANCE_PAGE_LABELS.locationLabel}</p>
                <p className="font-medium text-ui-text">{request.location}</p>
              </div>
            )}
          </div>

          {/* Reporter */}
          <div className="card">
            <h2 className="text-lg font-semibold text-ui-text mb-4">
              {MAINTENANCE_PAGE_LABELS.reporterTitle}
            </h2>
            {request.reportedBy ? (
              <Link
                href={`/residents/${request.reportedById}`}
                className="flex items-center gap-3 p-3 bg-ui-subtle rounded-lg hover:bg-ui-subtle"
              >
                <span className="text-xl">👤</span>
                <p className="font-medium text-ui-text">
                  {request.reportedBy.code}
                </p>
              </Link>
            ) : request.reporterName ? (
              <div className="p-3 bg-ui-subtle rounded-lg">
                <p className="font-medium text-ui-text">
                  {request.reporterName}
                </p>
              </div>
            ) : (
              <p className="text-ui-muted">{MAINTENANCE_PAGE_LABELS.notAngegeben}</p>
            )}
          </div>

          {/* Assignment */}
          {request.assignedTo && (
            <div className="card">
              <h2 className="text-lg font-semibold text-ui-text mb-4">
                {MAINTENANCE_PAGE_LABELS.assignedTitle}
              </h2>
              <div className="p-3 bg-status-info/8 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🔧</span>
                  <p className="font-medium text-ui-text">
                    {request.assignedTo}
                  </p>
                </div>
                {request.assignedAt && (
                  <p className="text-sm text-ui-muted mt-1">
                    {MAINTENANCE_PAGE_LABELS.assignedSince(formatDate(request.assignedAt))}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="card">
            <h2 className="text-lg font-semibold text-ui-text mb-4">
              {MAINTENANCE_PAGE_LABELS.timelineTitle}
            </h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-ui-muted">{MAINTENANCE_PAGE_LABELS.timelineCreated}</dt>
                <dd className="text-ui-text">{formatDate(request.createdAt)}</dd>
              </div>
              {request.assignedAt && (
                <div className="flex justify-between">
                  <dt className="text-ui-muted">{MAINTENANCE_PAGE_LABELS.timelineAssigned}</dt>
                  <dd className="text-ui-text">{formatDate(request.assignedAt)}</dd>
                </div>
              )}
              {request.startedAt && (
                <div className="flex justify-between">
                  <dt className="text-ui-muted">{MAINTENANCE_PAGE_LABELS.timelineStarted}</dt>
                  <dd className="text-ui-text">{formatDate(request.startedAt)}</dd>
                </div>
              )}
              {request.completedAt && (
                <div className="flex justify-between">
                  <dt className="text-ui-muted">{MAINTENANCE_PAGE_LABELS.timelineCompleted}</dt>
                  <dd className="text-ui-text">{formatDate(request.completedAt)}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Notes */}
          {request.notes && (
            <div className="card">
              <h2 className="text-lg font-semibold text-ui-text mb-4">
                {MAINTENANCE_PAGE_LABELS.notesTitle}
              </h2>
              <p className="text-sm text-ui-muted">{request.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
