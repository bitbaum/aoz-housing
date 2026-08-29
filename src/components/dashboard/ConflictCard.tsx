'use client'

import Link from 'next/link'
import { DISPLAY_LIMITS } from '@/lib/config/thresholds'
import { ALGORITHM_ACCURACY_LABELS } from '@/lib/constants/labels/dashboard'

interface HotspotUnit {
  id: string
  code: string
  conflicts: number
  occupancy: string // e.g., "5/5"
}

interface ConflictCardProps {
  activeConflicts: number
  recentConflicts: number // last 7 days
  hotspotUnits: HotspotUnit[]
  oldestConflictDays?: number
}

export function ConflictCard({
  activeConflicts,
  recentConflicts,
  hotspotUnits,
  oldestConflictDays,
}: ConflictCardProps) {
  const hasConflicts = activeConflicts > 0
  const hasHotspots = hotspotUnits.length > 0

  const getConflictColor = (count: number): string => {
    if (count === 0) return 'text-status-success'
    if (count <= 2) return 'text-status-warning'
    if (count <= 5) return 'text-status-warning'
    return 'text-status-error'
  }

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-ui-text mb-4">
        {ALGORITHM_ACCURACY_LABELS.conflictCardTitle}
      </h2>

      {/* Main stat */}
      <Link href="/incidents?category=INTERPERSONAL" className="block mb-4 group">
        <div className="flex items-baseline gap-2">
          <span className={`text-3xl font-bold ${getConflictColor(activeConflicts)}`}>
            {activeConflicts}
          </span>
          <span className="text-ui-muted text-sm">
            {ALGORITHM_ACCURACY_LABELS.conflictCardActiveSuffix}
          </span>
        </div>
        {oldestConflictDays !== undefined && activeConflicts > 0 && (
          <p className="text-sm text-ui-muted mt-1 group-hover:text-ui-muted">
            {ALGORITHM_ACCURACY_LABELS.conflictCardOldest(oldestConflictDays)}
          </p>
        )}
      </Link>

      {/* Hotspot units */}
      {hasHotspots && (
        <div className="border-t border-ui-border pt-4 mt-4">
          <p className="text-sm font-medium text-ui-muted mb-3">
            {ALGORITHM_ACCURACY_LABELS.conflictCardHotspots}
          </p>
          <div className="space-y-2">
            {hotspotUnits.slice(0, DISPLAY_LIMITS.dashboardItems).map((unit) => (
              <Link
                key={unit.id}
                href={`/housing/${unit.id}`}
                className="flex items-center justify-between py-2 px-3 bg-ui-subtle rounded-lg hover:bg-ui-subtle transition-colors"
              >
                <div>
                  <span className="font-medium text-ui-text text-sm">{unit.code}</span>
                  <span className="text-ui-muted text-sm ml-2">
                    {unit.occupancy} {ALGORITHM_ACCURACY_LABELS.conflictCardOccupied}
                  </span>
                </div>
                <span className="text-sm text-status-warning font-medium">
                  {ALGORITHM_ACCURACY_LABELS.conflictCardConflictCount(unit.conflicts)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent trend */}
      <div className="border-t border-ui-border pt-4 mt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-ui-muted">{ALGORITHM_ACCURACY_LABELS.conflictCardLast7Days}</span>
          <span className={recentConflicts === 0 ? 'text-status-success' : 'text-ui-text'}>
            {recentConflicts === 0
              ? ALGORITHM_ACCURACY_LABELS.conflictCardNoneNew
              : ALGORITHM_ACCURACY_LABELS.conflictCardNewCount(recentConflicts)}
          </span>
        </div>
      </div>

      {/* All empty state */}
      {!hasConflicts && (
        <div className="py-4 text-center">
          <span className="text-status-success text-2xl block mb-2">✓</span>
          <p className="text-status-success-text text-sm">
            {ALGORITHM_ACCURACY_LABELS.conflictCardAllClear}
          </p>
        </div>
      )}

      <Link
        href="/incidents"
        className="flex items-center justify-center min-h-[44px] mt-4 pt-4 border-t border-ui-border text-sm text-brand-primary hover:underline"
      >
        {ALGORITHM_ACCURACY_LABELS.conflictCardViewAll}
      </Link>
    </div>
  )
}
