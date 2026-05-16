'use client'

import Link from 'next/link'

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
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Systemstatus</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {/* Conflicts - actual number */}
        <div className="text-center">
          <div className={`text-3xl font-bold ${totalConflicts === 0 ? 'text-status-success' : totalConflicts <= 3 ? 'text-status-warning' : 'text-status-error'}`}>
            {totalConflicts}
          </div>
          <p className="text-sm text-gray-600 mt-1">Konflikte (30 Tage)</p>
          {worstUnit && worstUnit.conflicts > 0 ? (
            <Link
              href={`/housing/${worstUnit.id}`}
              className="text-xs text-aoz-primary hover:underline mt-2 block"
            >
              {worstUnit.code}: {worstUnit.conflicts} Konflikte →
            </Link>
          ) : (
            <p className="text-xs text-status-success mt-2">Keine Brennpunkte</p>
          )}
        </div>

        {/* Capacity - actual beds */}
        <div className="text-center">
          <div className={`text-3xl font-bold ${freeBeds >= 5 ? 'text-status-success' : freeBeds >= 2 ? 'text-status-warning' : 'text-status-error'}`}>
            {freeBeds}
          </div>
          <p className="text-sm text-gray-600 mt-1">Plätze frei</p>
          <p className="text-xs text-gray-500 mt-2">
            von {totalBeds} total
          </p>
        </div>

        {/* Maintenance - actual tickets */}
        <div className="text-center">
          <div className={`text-3xl font-bold ${openMaintenanceCount === 0 ? 'text-status-success' : openMaintenanceCount <= 3 ? 'text-status-warning' : 'text-status-error'}`}>
            {openMaintenanceCount}
          </div>
          <p className="text-sm text-gray-600 mt-1">Wartung offen</p>
          {openMaintenanceCount > 0 && oldestTicketDays !== undefined ? (
            <Link
              href="/maintenance"
              className="text-xs text-aoz-primary hover:underline mt-2 block"
            >
              Älteste: {oldestTicketDays} Tage →
            </Link>
          ) : (
            <p className="text-xs text-status-success mt-2">Alles erledigt</p>
          )}
        </div>
      </div>
    </div>
  )
}
