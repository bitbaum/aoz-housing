'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChoreCard } from './ChoreCard'
import { FairnessSummary } from './FairnessSummary'
import {
  TASK_CATEGORY_LABELS,
  TASK_CATEGORY_ICONS,
  CHORE_LABELS,
} from '@/lib/config/household-tasks'
import { showToast } from '@/components/ui/Toast'

interface Task {
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

interface FairnessEntry {
  residentId: string
  code: string
  completions: number
}

interface ChoreListProps {
  tasks: Task[]
  fairness: FairnessEntry[]
}

export function ChoreList({ tasks, fairness }: ChoreListProps) {
  const router = useRouter()
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [completingId, setCompletingId] = useState<string | null>(null)

  const filteredTasks = activeCategory
    ? tasks.filter(t => t.category === activeCategory)
    : tasks

  const activeTasks = filteredTasks.filter(t => !t.isCompleted)
  const completedTasks = filteredTasks.filter(t => t.isCompleted)

  const urgentActionTasks = activeTasks.filter(
    t => t.currentStatus === 'NEEDS_ATTENTION' || t.currentStatus === 'REQUESTED' || t.priority === 'URGENT'
  )
  const routineTasks = activeTasks.filter(
    t => !(t.currentStatus === 'NEEDS_ATTENTION' || t.currentStatus === 'REQUESTED' || t.priority === 'URGENT')
  )

  async function handleQuickComplete(taskId: string) {
    setCompletingId(taskId)
    try {
      const res = await fetch(`/api/portal/chores/${taskId}/complete`, {
        method: 'POST',
      })
      if (res.ok) {
        router.refresh()
      } else {
        // Surface failures — previously the spinner just disappeared with no
        // feedback, so users had no idea their action didn't take.
        showToast('error', CHORE_LABELS.errors.generic)
      }
    } catch {
      showToast('error', CHORE_LABELS.errors.generic)
    } finally {
      setCompletingId(null)
    }
  }

  // Collect categories present in tasks
  const categories = Object.keys(TASK_CATEGORY_LABELS).filter(cat =>
    tasks.some(t => t.category === cat)
  )

  return (
    <div>
      {/* Category filter tabs */}
      {categories.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            onClick={() => setActiveCategory(null)}
            className={`min-h-[44px] px-4 py-2 rounded-sm text-sm font-medium whitespace-nowrap transition-colors ${
              !activeCategory
                ? 'bg-brand-primary text-ui-on-accent'
                : 'bg-ui-subtle text-ui-muted hover:bg-ui-border'
            }`}
          >
            {CHORE_LABELS.filter.all}
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
              className={`min-h-[44px] px-4 py-2 rounded-sm text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat
                  ? 'bg-brand-primary text-ui-on-accent'
                  : 'bg-ui-subtle text-ui-muted hover:bg-ui-border'
              }`}
            >
              {TASK_CATEGORY_ICONS[cat]} {TASK_CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      )}

      {/* Task list */}
      {activeTasks.length === 0 && completedTasks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl mb-2">📋</p>
          <p className="font-medium text-ui-text">{CHORE_LABELS.empty.title}</p>
          <p className="text-sm text-ui-muted mt-1">{CHORE_LABELS.empty.message}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {urgentActionTasks.length > 0 && (
            <div className="p-3 rounded-lg border border-status-warning/30 bg-status-warning/10">
              <p className="text-sm font-medium text-status-warning-text">{CHORE_LABELS.sections.urgentNow}</p>
              <p className="text-xs text-status-warning-text">{CHORE_LABELS.sections.urgentDesc}</p>
            </div>
          )}

          {urgentActionTasks.map(task => (
            <ChoreCard
              key={task.id}
              task={task}
              onQuickComplete={handleQuickComplete}
              isCompleting={completingId === task.id}
            />
          ))}

          {urgentActionTasks.length > 0 && routineTasks.length > 0 && (
            <p className="text-sm text-ui-muted pt-2">{CHORE_LABELS.sections.after}</p>
          )}
          {routineTasks.map(task => (
            <ChoreCard
              key={task.id}
              task={task}
              onQuickComplete={handleQuickComplete}
              isCompleting={completingId === task.id}
            />
          ))}

          {completedTasks.length > 0 && (
            <>
              <p className="text-sm text-ui-muted pt-4">{CHORE_LABELS.card.completed}</p>
              {completedTasks.map(task => (
                <ChoreCard
                  key={task.id}
                  task={task}
                  onQuickComplete={handleQuickComplete}
                  isCompleting={completingId === task.id}
                />
              ))}
            </>
          )}
        </div>
      )}

      {/* Fairness summary */}
      {fairness.length > 0 && (
        <div className="mt-8">
          <FairnessSummary fairness={fairness} />
        </div>
      )}
    </div>
  )
}
