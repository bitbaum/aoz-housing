import Link from 'next/link'
import { SATISFACTION_EMOJIS, SUPPORT_LEVEL_LABELS, getLabel } from '@/lib/constants'
import { PLACEMENT_STATUS_LABELS } from '@/lib/constants/labels/housing'
import { formatDate } from '@/lib/utils'
import { getCheckInInterval } from '@/lib/config/checkin-intervals'

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
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Neueste Platzierungen (90 Tage)
      </h2>
      {placements.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          Keine neuen Platzierungen
        </p>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {placements.slice(0, 10).map((placement) => {
              const { lastCheckIn, daysSinceCheckIn, isOverdue, supportLevel } = getCheckInStatus(placement, now)

              return (
                <div key={placement.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-gray-500">{formatDate(placement.startDate)}</p>
                      <Link href={`/residents/${placement.residentId}`} className="text-aoz-primary hover:underline font-medium">
                        {placement.resident.code}
                      </Link>
                      <p className="text-sm text-gray-600">
                        <Link href={`/housing/${placement.housingUnitId}`} className="text-aoz-primary hover:underline">
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
                        <span className={isOverdue ? 'text-orange-600' : 'text-gray-500'}>Check-in vor {daysSinceCheckIn}d</span>
                      </div>
                    ) : (
                      <span className={isOverdue ? 'text-orange-600 font-medium' : 'text-gray-500'}>
                        {isOverdue ? 'Check-in überfällig' : 'Check-in ausstehend'}
                      </span>
                    )}
                  </div>

                  {supportLevel !== 'STANDARD' && (
                    <p className="mt-1 text-xs text-orange-600">{getLabel(SUPPORT_LEVEL_LABELS, supportLevel)}</p>
                  )}
                </div>
              )
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th scope="col" className="text-left py-3 px-2 font-medium text-gray-500">Datum</th>
                  <th scope="col" className="text-left py-3 px-2 font-medium text-gray-500">Bewohner</th>
                  <th scope="col" className="text-left py-3 px-2 font-medium text-gray-500">Unterkunft</th>
                  <th scope="col" className="text-left py-3 px-2 font-medium text-gray-500">Letzter Check-in</th>
                  <th scope="col" className="text-left py-3 px-2 font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {placements.slice(0, 10).map((placement) => {
                  const { lastCheckIn, daysSinceCheckIn, isOverdue, supportLevel } = getCheckInStatus(placement, now)

                  return (
                    <tr key={placement.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-2 text-gray-500">{formatDate(placement.startDate)}</td>
                      <td className="py-3 px-2">
                        <Link href={`/residents/${placement.residentId}`} className="text-aoz-primary hover:underline">
                          {placement.resident.code}
                        </Link>
                        {supportLevel !== 'STANDARD' && (
                          <span className="ml-2 text-xs text-orange-600">
                            {getLabel(SUPPORT_LEVEL_LABELS, supportLevel)}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        <Link href={`/housing/${placement.housingUnitId}`} className="text-aoz-primary hover:underline">
                          {placement.housingUnit.code}
                        </Link>
                      </td>
                      <td className="py-3 px-2">
                        {lastCheckIn ? (
                          <div className="flex items-center gap-2">
                            <span aria-hidden="true">{SATISFACTION_EMOJIS[lastCheckIn.overallSatisfaction - 1]}</span>
                            <span className={`text-sm ${isOverdue ? 'text-orange-600' : 'text-gray-500'}`}>
                              vor {daysSinceCheckIn}d
                            </span>
                          </div>
                        ) : (
                          <span className={`text-sm ${isOverdue ? 'text-orange-600 font-medium' : 'text-gray-500'}`}>
                            {isOverdue ? 'Überfällig' : 'Ausstehend'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        <span className={`badge ${placement.status === 'ACTIVE' ? 'badge-active' : 'badge-ended'}`}>
                          {placement.status === 'ACTIVE' ? 'Aktiv' : 'Beendet'}
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
    ? Math.ceil((now.getTime() - new Date(lastCheckIn.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    : null
  const daysSinceStart = Math.ceil((now.getTime() - new Date(placement.startDate).getTime()) / (1000 * 60 * 60 * 24))
  const isOverdue = placement.status === 'ACTIVE' &&
    (daysSinceCheckIn === null ? daysSinceStart > intervalDays : daysSinceCheckIn > intervalDays)

  return { lastCheckIn, daysSinceCheckIn, isOverdue, supportLevel }
}
