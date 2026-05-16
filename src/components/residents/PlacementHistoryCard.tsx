import Link from 'next/link'
import { SPOT_TYPE_ICONS } from '@/lib/config/placement-spots'
import { END_REASON_LABELS, PLACEMENT_HISTORY_LABELS, getLabel } from '@/lib/constants'
import { formatDate } from '@/lib/utils'

interface PlacementSpot {
  type: string
  code: string
  label: string | null
}

interface PlacementWithDetails {
  id: string
  housingUnitId: string
  housingUnit: { code: string }
  spot: PlacementSpot | null
  startDate: Date
  endDate: Date | null
  status: string
  endReason: string | null
}

interface PlacementHistoryCardProps {
  placements: PlacementWithDetails[]
}

export function PlacementHistoryCard({ placements }: PlacementHistoryCardProps) {
  if (placements.length === 0) {
    return null
  }

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        {PLACEMENT_HISTORY_LABELS.title} ({placements.length})
      </h2>
      <div className="space-y-3">
        {placements.map((placement) => (
          <div
            key={placement.id}
            className={`flex items-center justify-between p-3 rounded-lg ${
              placement.status === 'TRANSFERRED'
                ? 'bg-status-info/8 border-l-4 border-status-info'
                : 'bg-gray-50'
            }`}
          >
            <div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/housing/${placement.housingUnitId}`}
                  className="inline-flex items-center py-2 -my-2 font-medium text-gray-900 hover:text-aoz-primary"
                >
                  {placement.housingUnit.code}
                </Link>
                {placement.status === 'TRANSFERRED' && (
                  <span className="text-blue-500 text-sm">{'\u{1F504}'}</span>
                )}
              </div>
              {placement.spot && (
                <p className="text-sm text-gray-500">
                  {SPOT_TYPE_ICONS[placement.spot.type as keyof typeof SPOT_TYPE_ICONS]}{' '}
                  {placement.spot.label || placement.spot.code}
                </p>
              )}
              <p className="text-sm text-gray-500">
                {formatDate(placement.startDate)} -{' '}
                {placement.endDate
                  ? formatDate(placement.endDate)
                  : PLACEMENT_HISTORY_LABELS.today}
              </p>
            </div>
            <div className="text-right">
              {placement.status === 'TRANSFERRED' ? (
                <span className="badge bg-status-info/15 text-blue-800">
                  {PLACEMENT_HISTORY_LABELS.transferred}
                </span>
              ) : placement.endReason ? (
                <span className="badge badge-ended">
                  {getLabel(END_REASON_LABELS, placement.endReason)}
                </span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
