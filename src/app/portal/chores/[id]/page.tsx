import { prisma } from '@/lib/db'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChoreActions } from '@/components/portal/ChoreActions'
import {
  TASK_CATEGORY_ICONS,
  TASK_CATEGORY_LABELS,
  TASK_TYPE_LABELS,
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_COLORS,
  REQUEST_STATUS_LABELS,
  CHORE_LABELS,
} from '@/lib/config/household-tasks'
import { formatDate } from '@/lib/utils'
import { QUERY_LIMITS } from '@/lib/config/thresholds'
import { requireResidentCookie } from '@/lib/portal-auth'
import { RESIDENT_NAME_SELECT, residentName } from '@/lib/utils/resident-name'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ChoreDetailPage({ params }: PageProps) {
  const { id } = await params
  const residentCode = await requireResidentCookie('/portal')

  const resident = await prisma.resident.findUnique({
    where: { code: residentCode },
    include: {
      placements: {
        where: { status: 'ACTIVE' },
        take: 1,
      },
    },
  })

  if (!resident || !resident.placements[0]) {
    redirect('/portal')
  }

  const placement = resident.placements[0]

  // task and roommatePlacements both depend only on placement — fetch in parallel
  const [task, roommatePlacements] = await Promise.all([
    prisma.householdTask.findFirst({
      where: {
        id,
        housingUnitId: placement.housingUnitId,
      },
      include: {
        createdByResident: { select: RESIDENT_NAME_SELECT },
        completions: {
          orderBy: { completedAt: 'desc' },
          take: QUERY_LIMITS.choreHistory,
          include: { completedBy: { select: RESIDENT_NAME_SELECT } },
        },
        attentionFlags: {
          orderBy: { createdAt: 'desc' },
          include: { flaggedBy: { select: RESIDENT_NAME_SELECT } },
        },
        requests: {
          orderBy: { createdAt: 'desc' },
          include: {
            requestedBy: { select: RESIDENT_NAME_SELECT },
            requestedResident: { select: RESIDENT_NAME_SELECT },
          },
        },
      },
    }),
    prisma.placement.findMany({
      where: {
        housingUnitId: placement.housingUnitId,
        status: 'ACTIVE',
        residentId: { not: resident.id },
      },
      select: {
        resident: { select: RESIDENT_NAME_SELECT },
      },
    }),
  ])

  if (!task) {
    notFound()
  }

  const roommates = roommatePlacements.map(p => p.resident)

  const icon = TASK_CATEGORY_ICONS[task.category] || '📋'
  const categoryLabel = TASK_CATEGORY_LABELS[task.category] || task.category
  const typeLabel = TASK_TYPE_LABELS[task.taskType] || task.taskType
  const statusLabel = TASK_STATUS_LABELS[task.currentStatus] || task.currentStatus
  const statusColor = TASK_STATUS_COLORS[task.currentStatus] || TASK_STATUS_COLORS.IDLE
  const priorityLabel = TASK_PRIORITY_LABELS[task.priority] || task.priority
  const priorityColor = TASK_PRIORITY_COLORS[task.priority] || TASK_PRIORITY_COLORS.NORMAL

  const activeFlags = task.attentionFlags.filter(f => !f.isResolved)
  const activeRequests = task.requests.filter(r => r.status === 'PENDING' || r.status === 'ACCEPTED')

  return (
    <div>
      <Link
        href="/portal/chores"
        className="inline-flex items-center min-h-[44px] px-1 -ml-1 mb-2 text-sm text-brand-primary hover:underline"
      >
        ← {CHORE_LABELS.pages.list}
      </Link>

      {/* Header */}
      <div className="card mb-6">
        <div className="flex items-start gap-3 mb-4">
          <span className="text-3xl" aria-hidden="true">{icon}</span>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-ui-text">{task.title}</h1>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="chip-neutral">
                {categoryLabel}
              </span>
              <span className="chip-neutral">
                {typeLabel}
              </span>
              <span className={`chip ${statusColor}`}>
                {statusLabel}
              </span>
              <span className={`chip ${priorityColor}`}>
                {priorityLabel}
              </span>
            </div>
          </div>
        </div>

        {task.description && (
          <div className="mb-3">
            <h3 className="text-sm font-medium text-ui-muted">{CHORE_LABELS.detail.description}</h3>
            <p className="text-sm text-ui-muted mt-1">{task.description}</p>
          </div>
        )}

        {task.instructions && (
          <div className="mb-3">
            <h3 className="text-sm font-medium text-ui-muted">{CHORE_LABELS.detail.instructions}</h3>
            <p className="text-sm text-ui-muted mt-1 whitespace-pre-line">{task.instructions}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-4 text-sm text-ui-muted">
          {task.scheduleHuman && (
            <span>📅 {CHORE_LABELS.detail.schedule}: {task.scheduleHuman}</span>
          )}
          {task.estimatedMinutes && (
            <span>⏱️ ~{task.estimatedMinutes} {CHORE_LABELS.detail.minutes}</span>
          )}
          {task.createdByResident && (
            <span>👤 {residentName(task.createdByResident)}</span>
          )}
          {task.createdByStaff && (
            <span>👤 {task.createdByStaff}</span>
          )}
        </div>
      </div>

      {/* Actions */}
      {!task.isCompleted && (
        <div className="mb-6">
          <ChoreActions taskId={task.id} roommates={roommates} />
        </div>
      )}

      {/* Completion history */}
      <div className="card mb-6">
        <h2 className="font-semibold text-ui-text mb-3">{CHORE_LABELS.detail.history}</h2>
        {task.completions.length === 0 ? (
          <p className="text-sm text-ui-muted">{CHORE_LABELS.detail.noHistory}</p>
        ) : (
          <div className="space-y-3">
            {task.completions.map(c => (
              <div key={c.id} className="flex items-start justify-between p-3 bg-status-success/10 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-ui-text">{residentName(c.completedBy)}</p>
                  {c.notes && <p className="text-sm text-ui-muted mt-0.5">{c.notes}</p>}
                </div>
                <div className="text-right">
                  <p className="text-sm text-ui-muted">{formatDate(c.completedAt)}</p>
                  {c.durationMinutes && (
                    <p className="text-sm text-ui-muted">{c.durationMinutes} {CHORE_LABELS.detail.minutes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active requests */}
      {activeRequests.length > 0 && (
        <div className="card mb-6">
          <h2 className="font-semibold text-ui-text mb-3">{CHORE_LABELS.detail.activeRequests}</h2>
          <div className="space-y-3">
            {activeRequests.map(r => (
              <div key={r.id} className="p-3 bg-brand-primary/8 rounded-lg">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-ui-text">
                    {residentName(r.requestedBy)} → {r.requestedResident ? residentName(r.requestedResident) : CHORE_LABELS.request.broadcast}
                  </p>
                  <span className="chip bg-brand-primary/10 text-brand-primary">
                    {REQUEST_STATUS_LABELS[r.status]}
                  </span>
                </div>
                {r.message && <p className="text-sm text-ui-muted mt-1">{r.message}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attention flags */}
      {activeFlags.length > 0 && (
        <div className="card mb-6">
          <h2 className="font-semibold text-ui-text mb-3">{CHORE_LABELS.detail.attentionFlags}</h2>
          <div className="space-y-3">
            {activeFlags.map(f => (
              <div key={f.id} className="p-3 bg-status-warning/10 rounded-lg">
                <p className="text-sm font-medium text-ui-text">
                  ⚠️ {residentName(f.flaggedBy)}
                </p>
                {f.message && <p className="text-sm text-ui-muted mt-1">{f.message}</p>}
                <p className="text-sm text-ui-muted mt-1">{formatDate(f.createdAt)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
