'use client'

import Link from 'next/link'
import { ALGORITHM_ACCURACY_LABELS } from '@/lib/constants/labels/dashboard'

interface DashboardMetricsProps {
  totalResidents: number
  unplacedCount: number
  freeBeds: number
  totalBeds: number
  overdueCheckIns: number
  activePlacements: number
  openIncidents: number
  interpersonalCount: number
  maintenanceCount: number
}

export function DashboardMetrics({
  totalResidents,
  unplacedCount,
  freeBeds,
  totalBeds,
  overdueCheckIns,
  activePlacements,
  openIncidents,
  interpersonalCount,
  maintenanceCount,
}: DashboardMetricsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Residents */}
      <Link href="/residents" className="card-hover">
        <p className="text-sm text-ui-muted">{ALGORITHM_ACCURACY_LABELS.statResidents}</p>
        <p className="text-3xl font-bold text-ui-text mt-1">{totalResidents}</p>
        <p className={`text-sm mt-2 ${unplacedCount > 0 ? 'text-status-warning' : 'text-ui-muted'}`}>
          {unplacedCount > 0 ? ALGORITHM_ACCURACY_LABELS.statWaitingForPlacement(unplacedCount) : ALGORITHM_ACCURACY_LABELS.statAllPlaced}
        </p>
      </Link>

      {/* Free beds - actionable number */}
      <Link href="/housing" className="card-hover">
        <p className="text-sm text-ui-muted">{ALGORITHM_ACCURACY_LABELS.statFreeBeds}</p>
        <p className={`text-3xl font-bold mt-1 ${freeBeds >= 5 ? 'text-status-success' : freeBeds >= 2 ? 'text-status-warning' : 'text-status-error'}`}>
          {freeBeds}
        </p>
        <p className="text-sm mt-2 text-ui-muted">
          {ALGORITHM_ACCURACY_LABELS.statOfTotal(totalBeds)}
        </p>
      </Link>

      {/* Overdue Check-ins - actionable! */}
      <Link href="/placements?status=active&overdue=1" className="card-hover">
        <p className="text-sm text-ui-muted">{ALGORITHM_ACCURACY_LABELS.statCheckInsOverdue}</p>
        <p className={`text-3xl font-bold mt-1 ${overdueCheckIns === 0 ? 'text-status-success' : overdueCheckIns <= 3 ? 'text-status-warning' : 'text-status-error'}`}>
          {overdueCheckIns}
        </p>
        <p className="text-sm mt-2 text-ui-muted">
          {ALGORITHM_ACCURACY_LABELS.statActivePlacements(activePlacements)}
        </p>
      </Link>

      {/* Open incidents */}
      <Link href="/incidents" className="card-hover">
        <p className="text-sm text-ui-muted">{ALGORITHM_ACCURACY_LABELS.statOpenIncidents}</p>
        <p className={`text-3xl font-bold mt-1 ${openIncidents === 0 ? 'text-status-success' : openIncidents <= 5 ? 'text-status-warning' : 'text-status-error'}`}>
          {openIncidents}
        </p>
        <p className="text-sm mt-2 text-ui-muted">
          {ALGORITHM_ACCURACY_LABELS.statConflictsMaintenance(interpersonalCount, maintenanceCount)}
        </p>
      </Link>
    </div>
  )
}
