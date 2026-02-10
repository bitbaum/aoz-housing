'use client'

import { CHORE_LABELS } from '@/lib/config/household-tasks'

interface FairnessEntry {
  residentId: string
  code: string
  completions: number
}

interface FairnessSummaryProps {
  fairness: FairnessEntry[]
}

export function FairnessSummary({ fairness }: FairnessSummaryProps) {
  const maxCompletions = Math.max(...fairness.map(f => f.completions), 1)

  return (
    <div className="card">
      <h3 className="font-semibold text-gray-900 mb-4">{CHORE_LABELS.fairness.title}</h3>
      <div className="space-y-3">
        {fairness.map(entry => {
          const percentage = Math.round((entry.completions / maxCompletions) * 100)
          return (
            <div key={entry.residentId}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">{entry.code}</span>
                <span className="text-sm text-gray-500">
                  {entry.completions} {CHORE_LABELS.fairness.completions}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div
                  className="bg-aoz-primary h-2.5 rounded-full transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
