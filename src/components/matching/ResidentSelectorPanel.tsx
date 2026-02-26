import Link from 'next/link'
import type { Resident } from '@prisma/client'
import type { ResidentWithPlacement } from '@/lib/matching/types'
import { AGE_RANGE_LABELS, LANGUAGE_LABELS, EMPTY_STATE_LABELS, MATCHING_LABELS, getLabel } from '@/lib/constants'
import { DISPLAY_LIMITS } from '@/lib/config/thresholds'

interface Props {
  filteredUnplacedResidents: Resident[]
  totalUnplaced: number
  placedResidents: ResidentWithPlacement[]
  totalResidentCount: number
  residentQuery: string
  params: { resident?: string; unit?: string; new?: string; q?: string }
}

export function ResidentSelectorPanel({
  filteredUnplacedResidents,
  totalUnplaced,
  placedResidents,
  totalResidentCount,
  residentQuery,
  params,
}: Props) {
  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        {MATCHING_LABELS.unplacedResidents} ({filteredUnplacedResidents.length}/{totalUnplaced})
      </h2>

      <form className="mb-3">
        <div className="flex gap-2">
          <input
            type="search"
            name="q"
            defaultValue={params.q || ''}
            placeholder={MATCHING_LABELS.searchPlaceholder}
            className="input flex-1"
          />
          <button type="submit" className="btn-outline text-sm min-h-[44px]">{MATCHING_LABELS.search}</button>
        </div>
        {params.resident && <input type="hidden" name="resident" value={params.resident} />}
        {params.unit && <input type="hidden" name="unit" value={params.unit} />}
        {params.new && <input type="hidden" name="new" value={params.new} />}
      </form>

      {filteredUnplacedResidents.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">
            {totalResidentCount === 0
              ? EMPTY_STATE_LABELS.noResidentsAtAll
              : residentQuery
              ? MATCHING_LABELS.noResidentsFound
              : EMPTY_STATE_LABELS.allResidentsPlaced}
          </p>
          {totalResidentCount === 0 && (
            <Link href="/residents/new" className="btn-outline mt-4 inline-block">
              {EMPTY_STATE_LABELS.createResident}
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredUnplacedResidents.map((resident) => (
            <div
              key={resident.id}
              className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                params.resident === resident.id
                  ? 'border-aoz-primary bg-aoz-primary/5'
                  : 'border-gray-200'
              }`}
            >
              <Link
                href={`/residents/${resident.id}`}
                className="flex items-center gap-3 flex-1 hover:opacity-80"
              >
                <div className="w-8 h-8 bg-aoz-primary text-white rounded-full flex items-center justify-center text-sm font-medium">
                  {resident.code.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-900 hover:text-aoz-primary">
                    {resident.code}
                  </p>
                  <p className="text-sm text-gray-500">
                    {getLabel(AGE_RANGE_LABELS, resident.ageRange)} ·{' '}
                    {resident.languages
                      .slice(0, DISPLAY_LIMITS.languagePreview)
                      .map((l) => getLabel(LANGUAGE_LABELS, l))
                      .join(', ')}
                  </p>
                </div>
              </Link>
              <Link
                href={`/matching?resident=${resident.id}`}
                className={`px-3 py-2 min-h-[44px] flex items-center justify-center rounded text-sm font-medium transition-colors ${
                  params.resident === resident.id
                    ? 'bg-aoz-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-aoz-primary hover:text-white'
                }`}
              >
                {params.resident === resident.id ? MATCHING_LABELS.selected : MATCHING_LABELS.matching}
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Placed residents section */}
      {placedResidents.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-md font-semibold text-gray-700 mb-3">
            {MATCHING_LABELS.placedResidents} ({placedResidents.length})
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            {MATCHING_LABELS.selectForAnalysis}
          </p>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {placedResidents.map((resident) => (
              <div
                key={resident.id}
                className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${
                  params.resident === resident.id
                    ? 'border-aoz-primary bg-aoz-primary/5'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <Link
                  href={`/residents/${resident.id}`}
                  className="flex items-center gap-2 flex-1 hover:opacity-80"
                >
                  <div className="w-7 h-7 bg-gray-400 text-white rounded-full flex items-center justify-center text-xs font-medium">
                    {resident.code.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {resident.code}
                    </p>
                    <p className="text-xs text-gray-500">
                      {resident.placements[0]?.housingUnit?.code || MATCHING_LABELS.placed}
                    </p>
                  </div>
                </Link>
                <Link
                  href={`/matching?resident=${resident.id}`}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    params.resident === resident.id
                      ? 'bg-aoz-primary text-white'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  {MATCHING_LABELS.compare}
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
