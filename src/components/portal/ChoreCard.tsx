'use client'

import Link from 'next/link'
import {
  TASK_CATEGORY_ICONS,
  TASK_STATUS_COLORS,
  TASK_STATUS_LABELS,
  TASK_PRIORITY_COLORS,
  CHORE_LABELS,
} from '@/lib/config/household-tasks'
import { UI_LABELS } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import { residentName, type NamedResident } from '@/lib/utils/resident-name'

interface ChoreCardProps {
  task: {
    id: string
    title: string
    category: string
    currentStatus: string
    priority: string
    isCompleted: boolean
    taskType: string
    completions: Array<{
      completedAt: string
      completedBy: NamedResident
    }>
    attentionFlags: Array<{ id: string }>
    requests: Array<{ id: string }>
  }
  onQuickComplete: (taskId: string) => void
  isCompleting: boolean
}

export function ChoreCard({ task, onQuickComplete, isCompleting }: ChoreCardProps) {
  const icon = TASK_CATEGORY_ICONS[task.category] || '📋'
  const statusColor = TASK_STATUS_COLORS[task.currentStatus] || TASK_STATUS_COLORS.IDLE
  const statusLabel = TASK_STATUS_LABELS[task.currentStatus] || task.currentStatus
  const lastCompletion = task.completions[0]
  const needsDecision =
    task.currentStatus === 'NEEDS_ATTENTION' || task.currentStatus === 'REQUESTED'

  return (
    <div className="card flex items-start gap-3 p-4">
      {/* Icon + Content */}
      <Link href={`/portal/chores/${task.id}`} className="flex items-start gap-3 flex-1 min-w-0">
        <span className="text-2xl shrink-0" aria-hidden="true">
          {icon}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-ui-text truncate">{task.title}</h3>
            {task.currentStatus !== 'IDLE' && (
              <span className={`chip ${statusColor}`}>{statusLabel}</span>
            )}
            {task.priority === 'HIGH' || task.priority === 'URGENT' ? (
              <span className={`chip ${TASK_PRIORITY_COLORS[task.priority]}`}>
                {task.priority === 'URGENT' ? '!' : '↑'}
              </span>
            ) : null}
          </div>
          <p className="text-sm text-ui-muted mt-0.5">
            {CHORE_LABELS.card.lastCompleted}:{' '}
            {lastCompletion
              ? `${formatDate(lastCompletion.completedAt)} ${CHORE_LABELS.card.by} ${residentName(lastCompletion.completedBy)}`
              : CHORE_LABELS.card.never}
          </p>
          {needsDecision && (
            <p className="text-xs text-status-warning-text mt-1">{CHORE_LABELS.openTaskHint}</p>
          )}
        </div>
      </Link>

      {/* Quick complete button */}
      {!task.isCompleted &&
        (needsDecision ? (
          <Link
            href={`/portal/chores/${task.id}`}
            className="min-h-[44px] px-3 py-2 bg-status-warning/10 text-status-warning-text hover:bg-status-warning/15 rounded-lg text-sm font-medium transition-colors flex items-center"
            title={CHORE_LABELS.openTaskAction}
          >
            {UI_LABELS.details}
          </Link>
        ) : (
          <button
            onClick={() => onQuickComplete(task.id)}
            disabled={isCompleting}
            className="min-h-[44px] px-3 py-2 bg-status-success/10 text-status-success-text hover:bg-status-success/15 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 shrink-0"
            title={CHORE_LABELS.markDoneDirectly}
          >
            {isCompleting ? '...' : CHORE_LABELS.done}
          </button>
        ))}
    </div>
  )
}
