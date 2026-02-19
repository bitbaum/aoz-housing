'use client'

import Link from 'next/link'
import {
  TASK_CATEGORY_ICONS,
  TASK_STATUS_COLORS,
  TASK_STATUS_LABELS,
  TASK_PRIORITY_COLORS,
  CHORE_LABELS,
} from '@/lib/config/household-tasks'
import { formatDate } from '@/lib/utils'

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
      completedBy: { code: string }
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
  const needsDecision = task.currentStatus === 'NEEDS_ATTENTION' || task.currentStatus === 'REQUESTED'

  return (
    <div className="card flex items-start gap-3 p-4">
      {/* Icon + Content */}
      <Link href={`/portal/chores/${task.id}`} className="flex items-start gap-3 flex-1 min-w-0">
        <span className="text-2xl flex-shrink-0" aria-hidden="true">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900 truncate">{task.title}</h3>
            {task.currentStatus !== 'IDLE' && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor}`}>
                {statusLabel}
              </span>
            )}
            {task.priority === 'HIGH' || task.priority === 'URGENT' ? (
              <span className={`text-xs px-2 py-0.5 rounded-full ${TASK_PRIORITY_COLORS[task.priority]}`}>
                {task.priority === 'URGENT' ? '!' : '↑'}
              </span>
            ) : null}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {CHORE_LABELS.card.lastCompleted}:{' '}
            {lastCompletion
              ? `${formatDate(lastCompletion.completedAt)} ${CHORE_LABELS.card.by} ${lastCompletion.completedBy.code}`
              : CHORE_LABELS.card.never}
          </p>
          {needsDecision && (
            <p className="text-xs text-amber-700 mt-1">Empfohlen: Aufgabe öffnen und zuerst Entscheidung treffen.</p>
          )}
        </div>
      </Link>

      {/* Quick complete button */}
      {!task.isCompleted && (
        needsDecision ? (
          <Link
            href={`/portal/chores/${task.id}`}
            className="min-h-[44px] px-3 py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-sm font-medium transition-colors flex items-center"
            title="Aufgabe öffnen und Entscheidung treffen"
          >
            Details
          </Link>
        ) : (
          <button
            onClick={() => onQuickComplete(task.id)}
            disabled={isCompleting}
            className="min-h-[44px] px-3 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex-shrink-0"
            title="Direkt als erledigt markieren"
          >
            {isCompleting ? '...' : 'Erledigt'}
          </button>
        )
      )}
    </div>
  )
}
