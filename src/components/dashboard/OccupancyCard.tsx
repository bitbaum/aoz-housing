'use client'

import Link from 'next/link'
import { getOccupancyLevel, OCCUPANCY_COLORS, type OccupancyLevel } from '@/lib/config/thresholds'
import { DASHBOARD_LABELS } from '@/lib/constants/labels'

interface UnitStatus {
  available: number
  full: number
  maintenance: number
  closed: number
}

interface OccupancyCardProps {
  occupiedBeds: number
  totalBeds: number
  unitStatus: UnitStatus
}

export function OccupancyCard({ occupiedBeds, totalBeds, unitStatus }: OccupancyCardProps) {
  const freeBeds = totalBeds - occupiedBeds
  const occupancyPercent = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0

  const OCCUPANCY_TEXT_COLORS: Record<OccupancyLevel, string> = {
    critical: 'text-status-error',
    warning: 'text-status-warning',
    healthy: 'text-status-success',
  }

  const occupancyLevel = getOccupancyLevel(occupancyPercent)
  const occupancyColor = OCCUPANCY_COLORS[occupancyLevel]
  const occupancyTextColor = OCCUPANCY_TEXT_COLORS[occupancyLevel]

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{DASHBOARD_LABELS.sectionOccupancy}</h2>

      {/* Progress bar visualization */}
      <Link href="/housing" className="block mb-4 group">
        <div className="flex items-baseline gap-2 mb-2">
          <span className={`text-3xl font-bold ${occupancyTextColor}`}>
            {occupancyPercent}%
          </span>
          <span className="text-gray-500 text-sm">{DASHBOARD_LABELS.occupancyOccupied}</span>
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${occupancyColor} transition-all duration-300`}
            style={{ width: `${occupancyPercent}%` }}
          />
        </div>
        <p className="text-sm text-gray-500 mt-2 group-hover:text-gray-700">
          {occupiedBeds} {DASHBOARD_LABELS.occupancyOf} {totalBeds} {DASHBOARD_LABELS.occupancyPlaces} • <span className="font-medium">{freeBeds} {DASHBOARD_LABELS.occupancyFree}</span>
        </p>
      </Link>

      {/* Unit status breakdown */}
      <div className="border-t border-gray-100 pt-4 mt-4">
        <p className="text-sm font-medium text-gray-700 mb-3">{DASHBOARD_LABELS.sectionHousing}</p>
        <div className="space-y-2">
          <StatusRow
            label={DASHBOARD_LABELS.occupancyAvailable}
            count={unitStatus.available}
            color="bg-status-success"
            href="/housing?status=AVAILABLE"
          />
          <StatusRow
            label={DASHBOARD_LABELS.occupancyFull}
            count={unitStatus.full}
            color="bg-status-warning"
            href="/housing?status=FULL"
          />
          <StatusRow
            label={DASHBOARD_LABELS.occupancyMaintenance}
            count={unitStatus.maintenance}
            color="bg-status-warning"
            href="/housing?status=MAINTENANCE"
          />
          {unitStatus.closed > 0 && (
            <StatusRow
              label={DASHBOARD_LABELS.occupancyClosed}
              count={unitStatus.closed}
              color="bg-gray-400"
              href="/housing?status=CLOSED"
            />
          )}
        </div>
      </div>

      <Link
        href="/housing"
        className="flex items-center justify-center min-h-[44px] mt-4 pt-4 border-t border-gray-100 text-sm text-aoz-primary hover:underline"
      >
        {DASHBOARD_LABELS.occupancyViewAll} →
      </Link>
    </div>
  )
}

function StatusRow({
  label,
  count,
  color,
  href,
}: {
  label: string
  count: number
  color: string
  href: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50 transition-colors -mx-2"
    >
      <div className="flex items-center gap-2">
        <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <span className="text-sm font-medium text-gray-900">{count}</span>
    </Link>
  )
}
