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
      <h2 className="text-lg font-semibold text-ui-text mb-4">
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
          <p className="text-ui-muted">
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
                  : 'border-ui-border'
              }`}
            >
              <Link
                href={`/residents/${resident.id}`}
                className="flex items-center gap-3 flex-1 hover:opacity-80"
              >
                <div className="avatar-sm">
                  {resident.code.slice(-3)}
                </div>
                <div>
                  <p className="inline-flex items-center py-2 -my-2 font-medium text-ui-text hover:text-aoz-primary">
                    {resident.code}
                  </p>
                  <p className="text-sm text-ui-muted">
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
                    ? 'bg-aoz-primary text-ui-on-accent'
                    : 'bg-ui-subtle text-ui-muted hover:bg-aoz-primary hover:text-ui-on-accent'
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
        <div className="mt-6 pt-6 border-t border-ui-border">
          <h3 className="text-md font-semibold text-ui-muted mb-3">
            {MATCHING_LABELS.placedResidents} ({placedResidents.length})
          </h3>
          <p className="text-xs text-ui-muted mb-3">
            {MATCHING_LABELS.selectForAnalysis}
          </p>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {placedResidents.map((resident) => (
              <div
                key={resident.id}
                className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${
                  params.resident === resident.id
                    ? 'border-aoz-primary bg-aoz-primary/5'
                    : 'border-ui-border bg-ui-subtle'
                }`}
              >
                <Link
                  href={`/residents/${resident.id}`}
                  className="flex items-center gap-2 flex-1 hover:opacity-80"
                >
                  <div className="w-7 h-7 bg-ui-muted text-ui-on-accent rounded-full flex items-center justify-center text-xs font-medium">
                    {resident.code.slice(-3)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ui-muted">
                      {resident.code}
                    </p>
                    <p className="text-xs text-ui-muted">
                      {resident.placements[0]?.housingUnit?.code || MATCHING_LABELS.placed}
                    </p>
                  </div>
                </Link>
                <Link
                  href={`/matching?resident=${resident.id}`}
                  className={`min-h-[44px] px-3 py-2 rounded text-xs font-medium transition-colors flex items-center ${
                    params.resident === resident.id
                      ? 'bg-aoz-primary text-ui-on-accent'
                      : 'bg-ui-border text-ui-muted hover:bg-ui-border-strong'
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
