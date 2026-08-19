import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { clearFollowUpReminder } from '@/lib/actions'
import { requirePermission } from '@/lib/auth'
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
import { FollowUpTimeline } from '@/components/incidents/FollowUpTimeline'
import { FollowUpForm } from '@/components/incidents/FollowUpForm'
import { ResolutionLadder } from '@/components/governance/ResolutionLadder'
import { AgreementsPanel } from '@/components/governance/AgreementsPanel'
import { recommendNextStep } from '@/lib/governance/escalation'
import { AGREEMENT_CONFIG } from '@/lib/config/conflict-resolution'
import { IncidentSidebar } from '@/components/incidents/IncidentSidebar'
import { RESIDENT_NAME_SELECT, residentName } from '@/lib/utils/resident-name'

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
  await requirePermission('incidents:read')
  const { id } = await params
  const sp = await searchParams

  const incident = await prisma.incident.findUnique({
    where: { id },
    include: {
      housingUnit: {
        select: { code: true, address: true },
      },
      reportedBy: {
        select: RESIDENT_NAME_SELECT,
      },
      subject: {
        select: RESIDENT_NAME_SELECT,
      },
      involvedResidents: {
        include: {
          resident: {
            select: RESIDENT_NAME_SELECT,
          },
        },
      },
      followUps: {
        orderBy: { createdAt: 'desc' },
      },
      agreements: {
        orderBy: { createdAt: 'desc' },
        include: { parties: { include: { resident: { select: RESIDENT_NAME_SELECT } } } },
      },
    },
  })

  if (!incident) {
    notFound()
  }

  // What should happen next with this conflict, and why — computed, explainable,
  // and shown to staff instead of left to memory.
  const nextStep = recommendNextStep(
    {
      resolutionStage: incident.resolutionStage,
      stageEnteredAt: incident.stageEnteredAt,
      resolvedAt: incident.resolvedAt,
    },
    incident.agreements.map((a) => ({ status: a.status, reviewDate: a.reviewDate })),
    new Date()
  )

  // Everyone the conflict touches can be party to an agreement about it.
  const agreementCandidates = Array.from(
    new Map(
      [
        ...(incident.reportedById && incident.reportedBy
          ? [[incident.reportedById, residentName(incident.reportedBy)] as const]
          : []),
        ...(incident.subjectId && incident.subject
          ? [[incident.subjectId, residentName(incident.subject)] as const]
          : []),
        ...incident.involvedResidents.map(
          (i) => [i.residentId, residentName(i.resident)] as const
        ),
      ].map(([id, name]) => [id, { id, name }])
    ).values()
  )

  const defaultReviewDate = new Date()
  defaultReviewDate.setDate(defaultReviewDate.getDate() + AGREEMENT_CONFIG.defaultReviewDays)

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
        ]}
      />
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/incidents"
          className="inline-flex items-center min-h-[44px] px-1 -ml-1 text-sm text-brand-primary hover:underline"
        >
          {INCIDENT_DETAIL_LABELS.backLink}
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mt-2">
          <div className="flex items-center gap-4">
            <span className="text-3xl" role="img" aria-label={getLabel(INCIDENT_CATEGORY_LABELS, incident.category)}>
              {INCIDENT_CATEGORY_ICONS[incident.category] || '💬'}
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-ui-text">
                {getLabel(INCIDENT_TYPE_LABELS, incident.type)}
              </h1>
              <p className="text-ui-muted">
                {getLabel(INCIDENT_CATEGORY_LABELS, incident.category)} ·{' '}
                {getLabel(INCIDENT_SEVERITY_LABELS, incident.severity)} ·{' '}
                {formatDate(incident.date)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {incident.resolvedAt ? (
              <span className="badge badge-active">{INCIDENT_RESOLVED_LABELS.resolved}</span>
            ) : (
              <span className="badge badge-pending">{INCIDENT_RESOLVED_LABELS.open}</span>
            )}
          </div>
        </div>
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

          <ResolutionLadder
            incidentId={incident.id}
            currentStage={incident.resolutionStage}
            recommendation={nextStep}
          />

          <AgreementsPanel
            incidentId={incident.id}
            agreements={incident.agreements.map((agreement) => ({
              id: agreement.id,
              terms: agreement.terms,
              status: agreement.status,
              reviewDate: agreement.reviewDate.toISOString(),
              outcomeNotes: agreement.outcomeNotes,
              mediatorName: agreement.mediatorName,
              parties: agreement.parties.map((party) => ({
                residentId: party.residentId,
                residentName: residentName(party.resident),
                acceptedAt: party.acceptedAt?.toISOString() ?? null,
              })),
            }))}
            candidates={agreementCandidates}
            defaultReviewDate={defaultReviewDate.toISOString().slice(0, 10)}
          />

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
