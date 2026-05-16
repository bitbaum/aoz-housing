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
        <p className="text-sm text-gray-500">{ALGORITHM_ACCURACY_LABELS.statResidents}</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">{totalResidents}</p>
        <p className={`text-sm mt-2 ${unplacedCount > 0 ? 'text-orange-600' : 'text-gray-500'}`}>
          {unplacedCount > 0 ? ALGORITHM_ACCURACY_LABELS.statWaitingForPlacement(unplacedCount) : ALGORITHM_ACCURACY_LABELS.statAllPlaced}
        </p>
      </Link>

      {/* Free beds - actionable number */}
      <Link href="/housing" className="card-hover">
        <p className="text-sm text-gray-500">Freie Plätze</p>
        <p className={`text-3xl font-bold mt-1 ${freeBeds >= 5 ? 'text-green-600' : freeBeds >= 2 ? 'text-yellow-600' : 'text-red-600'}`}>
          {freeBeds}
        </p>
        <p className="text-sm mt-2 text-gray-500">
          {ALGORITHM_ACCURACY_LABELS.statOfTotal(totalBeds)}
        </p>
      </Link>

      {/* Overdue Check-ins - actionable! */}
      <Link href="/placements?status=active&overdue=1" className="card-hover">
        <p className="text-sm text-gray-500">Check-ins überfällig</p>
        <p className={`text-3xl font-bold mt-1 ${overdueCheckIns === 0 ? 'text-green-600' : overdueCheckIns <= 3 ? 'text-yellow-600' : 'text-orange-600'}`}>
          {overdueCheckIns}
        </p>
        <p className="text-sm mt-2 text-gray-500">
          {ALGORITHM_ACCURACY_LABELS.statActivePlacements(activePlacements)}
        </p>
      </Link>

      {/* Open incidents */}
      <Link href="/incidents" className="card-hover">
        <p className="text-sm text-gray-500">{ALGORITHM_ACCURACY_LABELS.statOpenIncidents}</p>
        <p className={`text-3xl font-bold mt-1 ${openIncidents === 0 ? 'text-green-600' : openIncidents <= 5 ? 'text-yellow-600' : 'text-red-600'}`}>
          {openIncidents}
        </p>
        <p className="text-sm mt-2 text-gray-500">
          {ALGORITHM_ACCURACY_LABELS.statConflictsMaintenance(interpersonalCount, maintenanceCount)}
        </p>
      </Link>
    </div>
  )
}
