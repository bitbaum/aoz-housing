'use client'

import { CHORE_LABELS } from '@/lib/config/household-tasks'
import { residentName } from '@/lib/utils/resident-name'

interface FairnessEntry {
  residentId: string
  code: string
  displayName?: string | null
  completions: number
}

interface FairnessSummaryProps {
  fairness: FairnessEntry[]
}

export function FairnessSummary({ fairness }: FairnessSummaryProps) {
  const maxCompletions = Math.max(...fairness.map(f => f.completions), 1)

  return (
    <div className="card">
      <h3 className="font-semibold text-ui-text mb-4">{CHORE_LABELS.fairness.title}</h3>
      <div className="space-y-3">
        {fairness.map(entry => {
          const percentage = Math.round((entry.completions / maxCompletions) * 100)
          return (
            <div key={entry.residentId}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-ui-muted">{residentName(entry)}</span>
                <span className="text-sm text-ui-muted">
                  {entry.completions} {CHORE_LABELS.fairness.completions}
                </span>
              </div>
              <div className="meter-lg">
                <div
                  className="meter-fill"
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
