import Link from 'next/link'
import { SATISFACTION_EMOJIS, SUPPORT_LEVEL_LABELS, getLabel } from '@/lib/constants'
import { PLACEMENT_STATUS_LABELS } from '@/lib/constants/labels/housing'
import { ALGORITHM_ACCURACY_LABELS } from '@/lib/constants/labels/dashboard'
import { daysSinceCeil, formatDate } from '@/lib/utils'
import { getCheckInInterval } from '@/lib/config/checkin-intervals'
import { DISPLAY_LIMITS } from '@/lib/config/thresholds'

interface PlacementRow {
  id: string
  startDate: Date | string
  status: string
  residentId: string
  housingUnitId: string
  resident: { code: string; supportLevel: string | null }
  housingUnit: { code: string }
  checkIns: { createdAt: Date | string; overallSatisfaction: number }[]
}

interface Props {
  placements: PlacementRow[]
}

export function RecentPlacementsTable({ placements }: Props) {
  const now = new Date()

  return (
    <div className="card mt-6">
      <h2 className="text-lg font-semibold text-ui-text mb-4">
        Neueste Platzierungen (90 Tage)
      </h2>
      {placements.length === 0 ? (
        <p className="text-ui-muted text-center py-8">
          Keine neuen Platzierungen
        </p>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {placements.slice(0, DISPLAY_LIMITS.unitMatches).map((placement) => {
              const { lastCheckIn, daysSinceCheckIn, isOverdue, supportLevel } = getCheckInStatus(placement, now)

              return (
                <div key={placement.id} className="border border-ui-border rounded-lg p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-ui-muted">{formatDate(placement.startDate)}</p>
                      <Link href={`/residents/${placement.residentId}`} className="inline-flex items-center py-2 -my-2 text-brand-primary hover:underline font-medium">
                        {placement.resident.code}
                      </Link>
                      <p className="text-sm text-ui-muted">
                        <Link href={`/housing/${placement.housingUnitId}`} className="inline-flex items-center py-2 -my-2 text-brand-primary hover:underline">
                          {placement.housingUnit.code}
                        </Link>
                      </p>
                    </div>
                    <span className={`badge ${placement.status === 'ACTIVE' ? 'badge-active' : 'badge-ended'}`}>
                      {PLACEMENT_STATUS_LABELS[placement.status] || placement.status}
                    </span>
                  </div>

                  <div className="mt-2 text-sm">
                    {lastCheckIn ? (
                      <div className="flex items-center gap-2">
                        <span aria-hidden="true">{SATISFACTION_EMOJIS[lastCheckIn.overallSatisfaction - 1]}</span>
                        <span className={isOverdue ? 'text-status-warning-text' : 'text-ui-muted'}>Check-in vor {daysSinceCheckIn}d</span>
                      </div>
                    ) : (
                      <span className={isOverdue ? 'text-status-warning-text font-medium' : 'text-ui-muted'}>
                        {isOverdue ? ALGORITHM_ACCURACY_LABELS.checkInOverdueBadge : ALGORITHM_ACCURACY_LABELS.checkInPendingBadge}
                      </span>
                    )}
                  </div>

                  {supportLevel !== 'STANDARD' && (
                    <p className="mt-1 text-xs text-status-warning-text">{getLabel(SUPPORT_LEVEL_LABELS, supportLevel)}</p>
                  )}
                </div>
              )
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-ui-border">
                  <th scope="col" className="text-left py-3 px-2 font-medium text-ui-muted">{ALGORITHM_ACCURACY_LABELS.tableColDate}</th>
                  <th scope="col" className="text-left py-3 px-2 font-medium text-ui-muted">{ALGORITHM_ACCURACY_LABELS.tableColResident}</th>
                  <th scope="col" className="text-left py-3 px-2 font-medium text-ui-muted">{ALGORITHM_ACCURACY_LABELS.tableColUnit}</th>
                  <th scope="col" className="text-left py-3 px-2 font-medium text-ui-muted">{ALGORITHM_ACCURACY_LABELS.tableColLastCheckIn}</th>
                  <th scope="col" className="text-left py-3 px-2 font-medium text-ui-muted">{ALGORITHM_ACCURACY_LABELS.tableColStatus}</th>
                </tr>
              </thead>
              <tbody>
                {placements.slice(0, DISPLAY_LIMITS.unitMatches).map((placement) => {
                  const { lastCheckIn, daysSinceCheckIn, isOverdue, supportLevel } = getCheckInStatus(placement, now)

                  return (
                    <tr key={placement.id} className="border-b border-ui-border hover:bg-ui-subtle">
                      <td className="py-3 px-2 text-ui-muted">{formatDate(placement.startDate)}</td>
                      <td className="py-3 px-2">
                        <Link href={`/residents/${placement.residentId}`} className="inline-flex items-center py-2 -my-2 text-brand-primary hover:underline">
                          {placement.resident.code}
                        </Link>
                        {supportLevel !== 'STANDARD' && (
                          <span className="ml-2 text-xs text-status-warning-text">
                            {getLabel(SUPPORT_LEVEL_LABELS, supportLevel)}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        <Link href={`/housing/${placement.housingUnitId}`} className="inline-flex items-center py-2 -my-2 text-brand-primary hover:underline">
                          {placement.housingUnit.code}
                        </Link>
                      </td>
                      <td className="py-3 px-2">
                        {lastCheckIn ? (
                          <div className="flex items-center gap-2">
                            <span aria-hidden="true">{SATISFACTION_EMOJIS[lastCheckIn.overallSatisfaction - 1]}</span>
                            <span className={`text-sm ${isOverdue ? 'text-status-warning-text' : 'text-ui-muted'}`}>
                              vor {daysSinceCheckIn}d
                            </span>
                          </div>
                        ) : (
                          <span className={`text-sm ${isOverdue ? 'text-status-warning-text font-medium' : 'text-ui-muted'}`}>
                            {isOverdue ? ALGORITHM_ACCURACY_LABELS.tableOverdue : ALGORITHM_ACCURACY_LABELS.tablePending}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        <span className={`badge ${placement.status === 'ACTIVE' ? 'badge-active' : 'badge-ended'}`}>
                          {PLACEMENT_STATUS_LABELS[placement.status] || placement.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

function getCheckInStatus(placement: PlacementRow, now: Date) {
  const lastCheckIn = placement.checkIns[0] || null
  const supportLevel = placement.resident.supportLevel || 'STANDARD'
  const intervalDays = getCheckInInterval(supportLevel)
  const daysSinceCheckIn = lastCheckIn
    ? daysSinceCeil(lastCheckIn.createdAt, now)
    : null
  const daysSinceStart = daysSinceCeil(placement.startDate, now)
  const isOverdue = placement.status === 'ACTIVE' &&
    (daysSinceCheckIn === null ? daysSinceStart > intervalDays : daysSinceCheckIn > intervalDays)

  return { lastCheckIn, daysSinceCheckIn, isOverdue, supportLevel }
}
