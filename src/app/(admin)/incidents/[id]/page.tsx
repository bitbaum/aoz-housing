import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { clearFollowUpReminder } from '@/lib/actions'
import {
  INCIDENT_TYPE_LABELS,
  INCIDENT_CATEGORY_LABELS,
  INCIDENT_CATEGORY_ICONS,
  INCIDENT_SEVERITY_LABELS,
  FOLLOW_UP_PRIORITY_LABELS,
  FOLLOW_UP_PRIORITY_COLORS,
  INCIDENT_RESOLVED_LABELS,
  INCIDENT_DETAIL_LABELS,
  getLabel,
} from '@/lib/constants'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const incident = await prisma.incident.findUnique({ where: { id }, select: { type: true } })
  return { title: incident ? (INCIDENT_TYPE_LABELS[incident.type as keyof typeof INCIDENT_TYPE_LABELS] ?? 'Vorfall') : 'Vorfall' }
}
import {
  getSeverityBorderClass,
  formatRelativeDate,
  formatDate,
} from '@/lib/utils'
import { SuccessToast } from '@/components/ui/SuccessToast'
import { PageHeader } from '@/components/ui/Page'
import { FollowUpTimeline } from '@/components/incidents/FollowUpTimeline'
import { FollowUpForm } from '@/components/incidents/FollowUpForm'
import { IncidentSidebar } from '@/components/incidents/IncidentSidebar'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{
    tpl?: string
    action?: string
    notes?: string
    outcome?: string
    followUpPriority?: string
    staffName?: string
  }>
}

export default async function IncidentDetailPage({ params, searchParams }: Props) {
  const { id } = await params
  const sp = await searchParams

  const incident = await prisma.incident.findUnique({
    where: { id },
    include: {
      housingUnit: {
        select: { code: true, address: true },
      },
      reportedBy: {
        select: { code: true },
      },
      subject: {
        select: { code: true },
      },
      involvedResidents: {
        include: {
          resident: {
            select: { code: true },
          },
        },
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

  const quickAction = sp.action || ''
  const quickNotes = sp.notes || ''
  const quickOutcome = sp.outcome || ''
  const quickPriority = ['LOW', 'MEDIUM', 'HIGH'].includes(sp.followUpPriority || '')
    ? sp.followUpPriority
    : ''
  const quickStaffName = sp.staffName || ''

  return (
    <div>
      <SuccessToast
        triggers={[
          { param: 'resolved', message: INCIDENT_DETAIL_LABELS.markedResolved },
          { param: 'created', message: INCIDENT_DETAIL_LABELS.created },
        ]}
      />
      {/* Header */}
      <div className="mb-6">
        <PageHeader
          backHref="/incidents"
          backLabel={INCIDENT_DETAIL_LABELS.backLink.replace(/^← /, '')}
          leading={
            <span className="text-3xl" role="img" aria-label={getLabel(INCIDENT_CATEGORY_LABELS, incident.category)}>
              {INCIDENT_CATEGORY_ICONS[incident.category] || '💬'}
            </span>
          }
          title={getLabel(INCIDENT_TYPE_LABELS, incident.type)}
          description={`${getLabel(INCIDENT_CATEGORY_LABELS, incident.category)} · ${getLabel(
            INCIDENT_SEVERITY_LABELS,
            incident.severity
          )} · ${formatDate(incident.date)}`}
          actions={
            incident.resolvedAt ? (
              <span className="badge badge-active">{INCIDENT_RESOLVED_LABELS.resolved}</span>
            ) : (
              <span className="badge badge-pending">{INCIDENT_RESOLVED_LABELS.open}</span>
            )
          }
        />
      </div>

      {/* Follow-up Reminder Banner */}
      {isOverdue && (
        <div className="mb-6 p-4 bg-status-error/8 border border-status-error/25 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl" role="img" aria-label={INCIDENT_DETAIL_LABELS.overdueAria}>⏰</span>
              <div>
                <p className="font-semibold text-status-error-text">
                  {INCIDENT_DETAIL_LABELS.overdueTitle(formatRelativeDate(incident.nextFollowUpDate!))}
                </p>
                {incident.followUpPriority && (
                  <p className="text-sm text-status-error-text">
                    {INCIDENT_DETAIL_LABELS.priorityPrefix}{getLabel(FOLLOW_UP_PRIORITY_LABELS, incident.followUpPriority)}
                  </p>
                )}
              </div>
            </div>
            <form action={clearFollowUpReminder}>
              <input type="hidden" name="incidentId" value={incident.id} />
              <button type="submit" className="btn-outline text-sm">
                {INCIDENT_DETAIL_LABELS.clearReminder}
              </button>
            </form>
          </div>
        </div>
      )}

      {incident.nextFollowUpDate && !isOverdue && !incident.resolvedAt && (
        <div className="mb-6 p-4 bg-status-info/8 border border-status-info/25 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-2xl" role="img" aria-label={INCIDENT_DETAIL_LABELS.scheduledAria}>📅</span>
            <div>
              <p className="font-semibold text-status-info-text">
                {INCIDENT_DETAIL_LABELS.scheduledTitle(formatDate(incident.nextFollowUpDate))}
              </p>
              {incident.followUpPriority && (
                <span className={`chip ${FOLLOW_UP_PRIORITY_COLORS[incident.followUpPriority]}`}>
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
            <h2 className="text-lg font-semibold text-ui-text mb-4">
              {INCIDENT_DETAIL_LABELS.descriptionTitle}
            </h2>
            <p className="text-ui-muted whitespace-pre-wrap">
              {incident.description}
            </p>

            {incident.resolution && (
              <div className="mt-4 pt-4 border-t border-ui-border">
                <h3 className="font-medium text-ui-text mb-2">{INCIDENT_DETAIL_LABELS.resolutionTitle}</h3>
                <p className="text-ui-muted">{incident.resolution}</p>
                <p className="text-sm text-ui-muted mt-1">
                  {INCIDENT_DETAIL_LABELS.resolvedAt(formatDate(incident.resolvedAt!))}
                </p>
              </div>
            )}
          </div>

          {/* Follow-ups Timeline + Form */}
          <div className="card">
            <FollowUpTimeline followUps={incident.followUps} />

            {/* Add Follow-up Form (only for unresolved incidents) */}
            {!incident.resolvedAt && (
              <FollowUpForm
                incidentId={incident.id}
                activeTemplate={sp.tpl}
                defaultAction={quickAction}
                defaultNotes={quickNotes}
                defaultOutcome={quickOutcome}
                defaultPriority={quickPriority}
                defaultStaffName={quickStaffName}
              />
            )}
          </div>
        </div>

        {/* Right column: Info and Actions */}
        <IncidentSidebar incident={{
          ...incident,
          followUpCount: incident.followUps.length,
        }} />
      </div>
    </div>
  )
}
