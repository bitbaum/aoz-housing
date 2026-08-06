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
      <h2 className="text-lg font-semibold text-ui-text mb-4">{DASHBOARD_LABELS.sectionOccupancy}</h2>

      {/* Progress bar visualization */}
      <Link href="/housing" className="block mb-4 group">
        <div className="flex items-baseline gap-2 mb-2">
          <span className={`text-3xl font-bold ${occupancyTextColor}`}>
            {occupancyPercent}%
          </span>
          <span className="text-ui-muted text-sm">{DASHBOARD_LABELS.occupancyOccupied}</span>
        </div>
        <div className="h-3 bg-ui-border rounded-full overflow-hidden">
          <div
            className={`h-full ${occupancyColor} transition-all duration-300`}
            style={{ width: `${occupancyPercent}%` }}
          />
        </div>
        <p className="text-sm text-ui-muted mt-2 group-hover:text-ui-muted">
          {occupiedBeds} {DASHBOARD_LABELS.occupancyOf} {totalBeds} {DASHBOARD_LABELS.occupancyPlaces} • <span className="font-medium">{freeBeds} {DASHBOARD_LABELS.occupancyFree}</span>
        </p>
      </Link>

      {/* Unit status breakdown */}
      <div className="border-t border-ui-border pt-4 mt-4">
        <p className="text-sm font-medium text-ui-muted mb-3">{DASHBOARD_LABELS.sectionHousing}</p>
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
              color="bg-ui-muted"
              href="/housing?status=CLOSED"
            />
          )}
        </div>
      </div>

      <Link
        href="/housing"
        className="flex items-center justify-center min-h-[44px] mt-4 pt-4 border-t border-ui-border text-sm text-brand-primary hover:underline"
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
      className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-ui-subtle transition-colors -mx-2"
    >
      <div className="flex items-center gap-2">
        <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
        <span className="text-sm text-ui-muted">{label}</span>
      </div>
      <span className="text-sm font-medium text-ui-text">{count}</span>
    </Link>
  )
}
