'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { SearchInput, SelectFilter, FilterBar } from '@/components/ui/FilterBar'
import {
  AGE_RANGE_LABELS,
  GENDER_LABELS_SHORT,
  RESIDENT_STATUS_LABELS,
  RESIDENT_LIST_LABELS,
  LANGUAGE_LABELS,
  getLabel,
} from '@/lib/constants'
import { getStatusBadgeClass, formatDate } from '@/lib/utils'
import { ResidentCardActions } from '@/components/residents/ResidentCardActions'

export interface ResidentListItem {
  id: string
  code: string
  ageRange: string
  gender: string
  status: string
  languages: string[]
  createdAt: Date | string
  placements: {
    housingUnit: {
      code: string
    }
  }[]
  incidentCount: number
}

const STATUS_OPTIONS = [
  { value: '', label: RESIDENT_LIST_LABELS.allStatus },
  { value: 'ACTIVE', label: RESIDENT_STATUS_LABELS.ACTIVE },
  { value: 'PLACED', label: RESIDENT_STATUS_LABELS.PLACED },
  { value: 'EXITED', label: RESIDENT_STATUS_LABELS.EXITED },
]

export function ResidentsList({ residents }: { residents: ResidentListItem[] }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const filtered = useMemo(() => {
    return residents.filter((r) => {
      const matchesSearch = !search ||
        r.code.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = !statusFilter || r.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [residents, search, statusFilter])

  return (
    <div>
      <FilterBar className="mb-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={RESIDENT_LIST_LABELS.searchPlaceholder}
          className="w-full sm:w-64"
        />
        <SelectFilter
          label={RESIDENT_LIST_LABELS.statusFilter}
          value={statusFilter}
          options={STATUS_OPTIONS}
          onChange={setStatusFilter}
        />
      </FilterBar>

      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          {residents.length === 0 ? (
            <>
              <p className="text-gray-500 mb-3">{RESIDENT_LIST_LABELS.emptyDefault}</p>
              <a href="/residents/new" className="btn-primary inline-flex items-center min-h-[44px] px-4">
                Ersten Bewohner erfassen
              </a>
            </>
          ) : (
            <>
              <p className="text-gray-500 mb-3">{RESIDENT_LIST_LABELS.emptyFiltered}</p>
              <button
                onClick={() => { setSearch(''); setStatusFilter('') }}
                className="inline-flex items-center min-h-[44px] px-1 text-sm text-aoz-primary hover:underline"
              >
                {RESIDENT_LIST_LABELS.filterReset}
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((resident) => (
            <ResidentCard key={resident.id} resident={resident} />
          ))}
        </div>
      )}
    </div>
  )
}

function ResidentCard({ resident }: { resident: ResidentListItem }) {
  const currentPlacement = resident.placements[0]
  const recentIncidents = resident.incidentCount

  const languages = resident.languages
    .slice(0, 3)
    .map((lang) => getLabel(LANGUAGE_LABELS, lang, lang))
    .join(', ')

  return (
    <div className="card-hover relative">
      <div className="absolute top-3 right-3 z-10">
        <ResidentCardActions residentId={resident.id} status={resident.status} />
      </div>
      <Link href={`/residents/${resident.id}`} className="block">
        <div className="flex items-start justify-between mb-3 pr-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-aoz-primary text-white rounded-full flex items-center justify-center font-medium">
              {resident.code.slice(-3)}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{resident.code}</h3>
              <p className="text-sm text-gray-500">
                {getLabel(AGE_RANGE_LABELS, resident.ageRange)} ·{' '}
                {getLabel(GENDER_LABELS_SHORT, resident.gender)}
              </p>
            </div>
          </div>
          <span className={`badge ${getStatusBadgeClass(resident.status)}`}>
            {getLabel(RESIDENT_STATUS_LABELS, resident.status)}
          </span>
        </div>

        <div className="space-y-2 text-sm">
          {currentPlacement ? (
            <div className="flex items-center gap-2 text-gray-600">
              <span>🏠</span>
              <span>{currentPlacement.housingUnit.code}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-orange-600">
              <span>⚠️</span>
              <span>{RESIDENT_LIST_LABELS.notPlaced}</span>
            </div>
          )}

          {languages && (
            <div className="flex items-center gap-2 text-gray-600">
              <span>🗣️</span>
              <span>{languages}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100">
          <span className="text-xs text-gray-500">
            Erfasst: {formatDate(resident.createdAt)}
          </span>
          {recentIncidents > 0 && (
            <span className="text-xs text-orange-600">
              {recentIncidents} {RESIDENT_LIST_LABELS.recentIncidentsSuffix}
            </span>
          )}
        </div>
      </Link>
    </div>
  )
}
