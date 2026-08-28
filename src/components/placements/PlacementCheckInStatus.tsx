import Link from 'next/link'
import { PLACEMENT_LIST_LABELS } from '@/lib/constants/labels'
import { SATISFACTION_EMOJIS, SATISFACTION_LABELS } from '@/lib/constants'

/**
 * Where a placement stands on check-ins — a signal, not a capture surface.
 *
 * This was an emoji tapper sitting in every row of the placements table: five
 * faces a caseworker could tap to record how a resident felt, from a list,
 * without having spoken to them. Tapping 4 or 5 wrote the check-in
 * immediately; only 1–3 opened the real form. So the pleasant answers were the
 * cheap ones to record, which is a measurement bias built into the input.
 *
 * The overdue signal is worth keeping — noticing that nobody has asked in
 * three weeks is exactly what this column is for. Recording the answer now
 * happens where a conversation actually happened: closing an appointment
 * (CareWorkspace), or the full form here.
 */
interface PlacementCheckInStatusProps {
  placementId: string
  isOverdue: boolean
  daysSinceCheckIn: number | null
  lastSatisfaction: number | null
}

export function PlacementCheckInStatus({
  placementId,
  isOverdue,
  daysSinceCheckIn,
  lastSatisfaction,
}: PlacementCheckInStatusProps) {
  const hasReading = lastSatisfaction !== null && lastSatisfaction >= 1 && lastSatisfaction <= 5

  return (
    <div className={`px-3 py-2 rounded-lg text-right ${isOverdue ? 'bg-status-warning/10' : ''}`}>
      <p
        className={`text-xs ${isOverdue ? 'text-status-warning font-medium' : 'text-ui-muted'}`}
      >
        {isOverdue ? PLACEMENT_LIST_LABELS.checkInOverdue : 'Check-in'}
      </p>

      {hasReading ? (
        <div className="flex items-center gap-2 justify-end mt-0.5">
          <span className="text-lg" aria-hidden="true">
            {SATISFACTION_EMOJIS[lastSatisfaction - 1]}
          </span>
          <span className="sr-only">{SATISFACTION_LABELS[lastSatisfaction - 1]}</span>
          {daysSinceCheckIn !== null && (
            <span className="text-xs text-ui-muted numeric">vor {daysSinceCheckIn}d</span>
          )}
        </div>
      ) : (
        <p className="text-xs text-ui-muted mt-0.5">{PLACEMENT_LIST_LABELS.checkInNone}</p>
      )}

      <Link
        href={`/placements/${placementId}/checkin`}
        className="inline-block text-xs text-brand-primary hover:underline mt-1 min-h-[44px] leading-[44px]"
      >
        {hasReading ? PLACEMENT_LIST_LABELS.checkInUpdate : PLACEMENT_LIST_LABELS.checkInCapture}
      </Link>
    </div>
  )
}
