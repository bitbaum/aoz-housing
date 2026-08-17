'use client'

import Link from 'next/link'
import { Accessibility, BedDouble, Home, ShieldAlert } from 'lucide-react'
import { getOccupancyColorClass } from '@/lib/utils'
import { HousingCardActions } from '@/components/housing/HousingCardActions'
import { HOUSING_STATUS_LABELS } from '@/lib/constants/labels/housing'
import { HOUSING_LIST_LABELS } from '@/lib/constants/labels'
import { unitLabel } from '@/lib/utils/unit-name'
import { EmptyState, ListShell } from '@/components/ui/Page'

export interface HousingListItem {
  id: string
  code: string
  /** Required, not optional — `null` means unnamed, missing means unasked. */
  nickname: string | null
  address: string
  status: string
  totalBeds: number
  totalRooms: number
  wheelchairAccess: boolean
  placementCount: number
  incidentCount: number
  buildingCode?: string | null
}

function groupHousingUnits(units: HousingListItem[]): { heading: string | null; units: HousingListItem[] }[] {
  const hasGroups = units.some((unit) => unit.buildingCode && unit.buildingCode.trim() !== '')
  if (!hasGroups) return [{ heading: null, units }]

  const buckets = new Map<string, HousingListItem[]>()
  const ungrouped: HousingListItem[] = []
  for (const unit of units) {
    const code = unit.buildingCode?.trim()
    if (!code) {
      ungrouped.push(unit)
      continue
    }
    const list = buckets.get(code) ?? []
    list.push(unit)
    buckets.set(code, list)
  }

  const groups = [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b, 'de-CH'))
    .map(([code, grouped]) => ({
      heading: HOUSING_LIST_LABELS.buildingGroup(code),
      units: grouped,
    }))

  if (ungrouped.length > 0) {
    groups.push({ heading: HOUSING_LIST_LABELS.ungroupedBuilding, units: ungrouped })
  }
  return groups
}

export function HousingList({ units }: { units: HousingListItem[] }) {
  if (units.length === 0) {
    return (
      <EmptyState
        title={HOUSING_LIST_LABELS.emptyDefault}
        description="Unterkünfte werden über den Erfassungsprozess angelegt und erscheinen danach hier."
      />
    )
  }

  const groups = groupHousingUnits(units)

  return (
    <ListShell>
      <div className="divide-y divide-ui-border">
        {groups.map((group) => (
          <div key={group.heading ?? 'all'}>
            {group.heading && (
              <p className="eyebrow px-4 pt-4 pb-1">{group.heading}</p>
            )}
            {group.units.map((unit) => (
              <UnitRow key={unit.id} unit={unit} />
            ))}
          </div>
        ))}
      </div>
    </ListShell>
  )
}

function UnitRow({ unit }: { unit: HousingListItem }) {
  const occupancy = unit.placementCount
  const totalBeds = Math.max(unit.totalBeds, 0)
  const occupancyPercent = totalBeds > 0
    ? Math.max(0, Math.min(100, Math.round((occupancy / totalBeds) * 100)))
    : 0
  const recentConflicts = unit.incidentCount

  const statusConfig: Record<string, { label: string; class: string }> = {
    AVAILABLE: { label: HOUSING_STATUS_LABELS.AVAILABLE, class: 'badge-active' },
    FULL: { label: HOUSING_STATUS_LABELS.FULL, class: 'badge-pending' },
    MAINTENANCE: { label: HOUSING_STATUS_LABELS.MAINTENANCE, class: 'badge-alert' },
    CLOSED: { label: HOUSING_STATUS_LABELS.CLOSED, class: 'badge-ended' },
  }
  const statusInfo = statusConfig[unit.status] || statusConfig.AVAILABLE

  return (
    <div className="group grid gap-4 px-4 py-4 transition-colors hover:bg-ui-subtle/70 md:grid-cols-[minmax(260px,1.4fr)_minmax(180px,1fr)_minmax(160px,0.8fr)_auto] md:items-center">
      <Link href={`/housing/${unit.id}`} className="min-w-0">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-ui-border bg-ui-subtle text-ui-muted">
            <Home className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-semibold text-ui-text group-hover:text-brand-primary">
              {unitLabel(unit)}
            </span>
            <span className="block truncate text-sm text-ui-muted">{unit.address}</span>
          </span>
        </div>
      </Link>

      <div className="min-w-0">
        <div className="mb-1 flex justify-between gap-3 text-sm">
          <span className="inline-flex items-center gap-2 text-ui-muted">
            <BedDouble className="h-4 w-4" />
            {HOUSING_LIST_LABELS.occupancy}
          </span>
          <span className="font-medium text-ui-text">{occupancy}/{totalBeds}</span>
        </div>
        <div className="meter">
          <div
            className={`meter-fill ${getOccupancyColorClass(occupancyPercent)}`}
            style={{ width: `${occupancyPercent}%` }}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm text-ui-muted">
        <span>{unit.totalRooms} Zimmer</span>
        {unit.wheelchairAccess ? (
          <span className="inline-flex items-center gap-1" title={HOUSING_LIST_LABELS.wheelchairTitle}>
            <Accessibility className="h-4 w-4" />
            Barrierefrei
          </span>
        ) : null}
        {recentConflicts > 0 ? (
          <span className="inline-flex items-center gap-1 text-status-warning-text">
            <ShieldAlert className="h-4 w-4" />
            {recentConflicts} Konflikte
          </span>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-3 md:justify-end">
        <span className={`badge ${statusInfo.class}`}>{statusInfo.label}</span>
        <HousingCardActions housingId={unit.id} status={unit.status} />
      </div>
    </div>
  )
}
