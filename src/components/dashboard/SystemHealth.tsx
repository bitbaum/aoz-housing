'use client'

import Link from 'next/link'
import { SYSTEM_HEALTH_LABELS } from '@/lib/constants'

interface SystemStatusProps {
  // Conflicts
  totalConflicts: number
  unitCount: number
  worstUnit?: { code: string; id: string; conflicts: number }
  // Capacity
  freeBeds: number
  totalBeds: number
  // Maintenance
  openMaintenanceCount: number
  oldestTicketDays?: number
}

export function SystemHealth({
  totalConflicts,
  unitCount,
  worstUnit,
  freeBeds,
  totalBeds,
  openMaintenanceCount,
  oldestTicketDays,
}: SystemStatusProps) {
  return (
    <div className="lg:col-span-2 card">
      <h2 className="text-lg font-semibold text-ui-text mb-4">{SYSTEM_HEALTH_LABELS.title}</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {/* Conflicts - actual number */}
        <div className="text-center">
          <div
            className={`text-3xl font-bold ${totalConflicts === 0 ? 'text-status-success' : totalConflicts <= 3 ? 'text-status-warning' : 'text-status-error'}`}
          >
            {totalConflicts}
          </div>
          <p className="text-sm text-ui-muted mt-1">{SYSTEM_HEALTH_LABELS.conflictsThirtyDays}</p>
          {worstUnit && worstUnit.conflicts > 0 ? (
            <Link
              href={`/housing/${worstUnit.id}`}
              className="text-xs text-brand-primary hover:underline mt-2 block"
            >
              {SYSTEM_HEALTH_LABELS.worstUnit(worstUnit.code, worstUnit.conflicts)}
            </Link>
          ) : (
            <p className="text-xs text-status-success mt-2">{SYSTEM_HEALTH_LABELS.noHotspots}</p>
          )}
        </div>

        {/* Capacity - actual beds */}
        <div className="text-center">
          <div
            className={`text-3xl font-bold ${freeBeds >= 5 ? 'text-status-success' : freeBeds >= 2 ? 'text-status-warning' : 'text-status-error'}`}
          >
            {freeBeds}
          </div>
          <p className="text-sm text-ui-muted mt-1">{SYSTEM_HEALTH_LABELS.bedsFree}</p>
          <p className="text-xs text-ui-muted mt-2">{SYSTEM_HEALTH_LABELS.ofTotal(totalBeds)}</p>
        </div>

        {/* Maintenance - actual tickets */}
        <div className="text-center">
          <div
            className={`text-3xl font-bold ${openMaintenanceCount === 0 ? 'text-status-success' : openMaintenanceCount <= 3 ? 'text-status-warning' : 'text-status-error'}`}
          >
            {openMaintenanceCount}
          </div>
          <p className="text-sm text-ui-muted mt-1">{SYSTEM_HEALTH_LABELS.maintenanceOpen}</p>
          {openMaintenanceCount > 0 && oldestTicketDays !== undefined ? (
            <Link
              href="/maintenance"
              className="text-xs text-brand-primary hover:underline mt-2 block"
            >
              {SYSTEM_HEALTH_LABELS.oldest(oldestTicketDays)}
            </Link>
          ) : (
            <p className="text-xs text-status-success mt-2">{SYSTEM_HEALTH_LABELS.allDone}</p>
          )}
        </div>
      </div>
    </div>
  )
}
