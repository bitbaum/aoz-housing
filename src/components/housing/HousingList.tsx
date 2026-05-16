'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { SearchInput, SelectFilter, FilterBar } from '@/components/ui/FilterBar'
import { getOccupancyColorClass } from '@/lib/utils'
import { HousingCardActions } from '@/components/housing/HousingCardActions'
import { HOUSING_STATUS_LABELS } from '@/lib/constants/labels/housing'
import { HOUSING_LIST_LABELS } from '@/lib/constants/labels'

export interface HousingListItem {
  id: string
  code: string
  address: string
  status: string
  totalBeds: number
  totalRooms: number
  wheelchairAccess: boolean
  placementCount: number
  incidentCount: number
}

const STATUS_OPTIONS = [
  { value: '', label: HOUSING_LIST_LABELS.allStatus },
  { value: 'AVAILABLE', label: HOUSING_STATUS_LABELS.AVAILABLE },
  { value: 'FULL', label: HOUSING_STATUS_LABELS.FULL },
  { value: 'MAINTENANCE', label: HOUSING_STATUS_LABELS.MAINTENANCE },
  { value: 'CLOSED', label: HOUSING_STATUS_LABELS.CLOSED },
]

export function HousingList({ units }: { units: HousingListItem[] }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const filtered = useMemo(() => {
    return units.filter((u) => {
      const matchesSearch = !search ||
        u.code.toLowerCase().includes(search.toLowerCase()) ||
        u.address.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = !statusFilter || u.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [units, search, statusFilter])

  return (
    <div>
      <FilterBar className="mb-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={HOUSING_LIST_LABELS.searchPlaceholder}
          className="w-full sm:w-64"
        />
        <SelectFilter
          label={HOUSING_LIST_LABELS.statusFilter}
          value={statusFilter}
          options={STATUS_OPTIONS}
          onChange={setStatusFilter}
        />
      </FilterBar>

      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          {units.length === 0 ? (
            <>
              <p className="text-gray-500 mb-3">{HOUSING_LIST_LABELS.emptyDefault}</p>
              <a href="/housing/new" className="btn-primary inline-flex items-center min-h-[44px] px-4">
                {HOUSING_LIST_LABELS.createHousingFirst}
              </a>
            </>
          ) : (
            <>
              <p className="text-gray-500 mb-3">{HOUSING_LIST_LABELS.emptyFiltered}</p>
              <button
                onClick={() => { setSearch(''); setStatusFilter('') }}
                className="inline-flex items-center min-h-[44px] px-1 text-sm text-aoz-primary hover:underline"
              >
                {HOUSING_LIST_LABELS.filterReset}
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((unit) => (
            <UnitCard key={unit.id} unit={unit} />
          ))}
        </div>
      )}
    </div>
  )
}

function UnitCard({ unit }: { unit: HousingListItem }) {
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

  const harmonyColor = recentConflicts === 0 ? 'bg-green-500' :
                       recentConflicts <= 2 ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <div className="card-hover relative">
      <div className="absolute top-3 right-3 z-10">
        <HousingCardActions housingId={unit.id} status={unit.status} />
      </div>
      <Link href={`/housing/${unit.id}`} className="block">
        <div className="flex items-start justify-between mb-3 pr-8">
          <div>
            <h3 className="font-semibold text-gray-900">{unit.code}</h3>
            <p className="text-sm text-gray-500">{unit.address}</p>
          </div>
          <span className={`badge ${statusInfo.class}`}>{statusInfo.label}</span>
        </div>

        <div className="flex items-center gap-4 mb-3">
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-500">{HOUSING_LIST_LABELS.occupancy}</span>
              <span className="font-medium">{occupancy}/{totalBeds}</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${getOccupancyColorClass(occupancyPercent)}`}
                style={{ width: `${occupancyPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>{unit.totalRooms} Zimmer</span>
            {unit.wheelchairAccess && <span title={HOUSING_LIST_LABELS.wheelchairTitle}>♿</span>}
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${harmonyColor}`} role="img" aria-label={`Harmonie: ${harmonyColor.includes('green') ? 'Gut' : harmonyColor.includes('yellow') ? 'Mittel' : harmonyColor.includes('red') ? 'Schlecht' : 'Unbekannt'}`} />
            {recentConflicts > 0 && (
              <span className="text-sm text-gray-500">
                {recentConflicts} Konflikte
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  )
}
