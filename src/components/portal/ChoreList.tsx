'use client'

import { useState } from 'react'
import { ChoreCard } from './ChoreCard'
import { FairnessSummary } from './FairnessSummary'
import {
  TASK_CATEGORY_LABELS,
  TASK_CATEGORY_ICONS,
  CHORE_LABELS,
} from '@/lib/config/household-tasks'

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
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [completingId, setCompletingId] = useState<string | null>(null)

  const filteredTasks = activeCategory
    ? tasks.filter(t => t.category === activeCategory)
    : tasks

  const activeTasks = filteredTasks.filter(t => !t.isCompleted)
  const completedTasks = filteredTasks.filter(t => t.isCompleted)

  async function handleQuickComplete(taskId: string) {
    setCompletingId(taskId)
    try {
      const res = await fetch(`/api/portal/chores/${taskId}/complete`, {
        method: 'POST',
      })
      if (res.ok) {
        window.location.reload()
      }
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
            className={`min-h-[44px] px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              !activeCategory
                ? 'bg-aoz-primary text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {CHORE_LABELS.filter.all}
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
              className={`min-h-[44px] px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat
                  ? 'bg-aoz-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
          <p className="font-medium text-gray-900">{CHORE_LABELS.empty.title}</p>
          <p className="text-sm text-gray-500 mt-1">{CHORE_LABELS.empty.message}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeTasks.map(task => (
            <ChoreCard
              key={task.id}
              task={task}
              onQuickComplete={handleQuickComplete}
              isCompleting={completingId === task.id}
            />
          ))}
          {completedTasks.length > 0 && (
            <>
              <p className="text-sm text-gray-500 pt-4">{CHORE_LABELS.card.completed}</p>
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
