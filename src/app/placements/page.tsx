import { prisma } from '@/lib/db'
import Link from 'next/link'
import {
  PLACEMENT_STATUS_LABELS,
  END_REASON_LABELS,
  SATISFACTION_EMOJIS,
  SUPPORT_LEVEL_LABELS,
  getLabel,
} from '@/lib/constants'
import {
  getStatusBadgeClass,
  formatDate,
} from '@/lib/utils'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ status?: string }>
}

export default async function PlacementsListPage({ searchParams }: Props) {
  const params = await searchParams
  const statusFilter = params.status || 'active'

  const placements = await prisma.placement.findMany({
    where: statusFilter === 'active'
      ? { status: 'ACTIVE' }
      : statusFilter === 'ended'
      ? { status: { not: 'ACTIVE' } }
      : undefined,
    include: {
      resident: true,
      housingUnit: true,
      checkIns: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          createdAt: true,
          overallSatisfaction: true,
          concerns: true,
        },
      },
    },
    orderBy: { startDate: 'desc' },
    take: 200,
  })

  // Get counts for all statuses (unfiltered)
  const allPlacements = await prisma.placement.findMany({
    select: { status: true, satisfactionRating: true, endReason: true },
  })

  const activePlacements = allPlacements.filter((p) => p.status === 'ACTIVE')
  const endedPlacements = allPlacements.filter((p) => p.status !== 'ACTIVE')

  const stats = {
    total: allPlacements.length,
    active: activePlacements.length,
    ended: endedPlacements.length,
    avgSatisfaction:
      allPlacements.filter((p) => p.satisfactionRating).length > 0
        ? Math.round(
            allPlacements
              .filter((p) => p.satisfactionRating)
              .reduce((sum, p) => sum + (p.satisfactionRating || 0), 0) /
              allPlacements.filter((p) => p.satisfactionRating).length
          )
        : null,
    conflictEnds: endedPlacements.filter((p) => p.endReason === 'CONFLICT')
      .length,
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Platzierungen</h1>
        <Link href="/matching" className="btn-primary">
          Neue Platzierung
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Aktiv" value={stats.active} />
        <StatCard label="Beendet" value={stats.ended} />
        <StatCard
          label="Ø Zufriedenheit"
          value={
            stats.avgSatisfaction
              ? `${SATISFACTION_EMOJIS[stats.avgSatisfaction - 1]} ${stats.avgSatisfaction}/5`
              : '-'
          }
        />
        <StatCard
          label="Konfliktbedingt beendet"
          value={stats.conflictEnds}
          highlight={stats.conflictEnds > 0}
        />
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex gap-2 border-b border-gray-200">
          <TabLink
            href="/placements?status=active"
            label="Aktiv"
            count={stats.active}
            active={statusFilter === 'active'}
          />
          <TabLink
            href="/placements?status=ended"
            label="Beendet"
            count={stats.ended}
            active={statusFilter === 'ended'}
          />
          <TabLink
            href="/placements?status=all"
            label="Alle"
            count={stats.total}
            active={statusFilter === 'all'}
          />
        </div>
      </div>

      {/* Placements List */}
      {placements.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-4">
            {statusFilter === 'active'
              ? 'Keine aktiven Platzierungen'
              : statusFilter === 'ended'
              ? 'Keine beendeten Platzierungen'
              : 'Keine Platzierungen vorhanden'}
          </p>
          <Link href="/matching" className="btn-primary">
            Neue Platzierung erstellen
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {placements.map((placement) => (
            <PlacementRow key={placement.id} placement={placement} />
          ))}
        </div>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: number | string
  highlight?: boolean
}) {
  return (
    <div className="card">
      <p className="text-sm text-gray-500">{label}</p>
      <p
        className={`text-2xl font-bold ${
          highlight ? 'text-orange-600' : 'text-gray-900'
        }`}
      >
        {value}
      </p>
    </div>
  )
}

function TabLink({
  href,
  label,
  count,
  active = false,
}: {
  href: string
  label: string
  count: number
  active?: boolean
}) {
  return (
    <Link
      href={href}
      className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
        active
          ? 'border-aoz-primary text-aoz-primary'
          : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      {label}
      <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded-full">
        {count}
      </span>
    </Link>
  )
}

function PlacementRow({ placement }: { placement: any }) {
  const daysSinceStart = Math.ceil(
    (Date.now() - new Date(placement.startDate).getTime()) / (1000 * 60 * 60 * 24)
  )
  const totalDuration = placement.endDate
    ? Math.ceil(
        (new Date(placement.endDate).getTime() -
          new Date(placement.startDate).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : daysSinceStart

  // Check-in status for active placements
  const lastCheckIn = placement.checkIns?.[0]
  const daysSinceCheckIn = lastCheckIn
    ? Math.ceil((Date.now() - new Date(lastCheckIn.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    : null

  // Check-in frequency based on support level (from resident)
  const supportLevel = placement.resident.supportLevel || 'STANDARD'
  const checkInIntervalDays = supportLevel === 'INTENSIVE' ? 7 : supportLevel === 'ELEVATED' ? 14 : 28
  const isCheckInOverdue = placement.status === 'ACTIVE' &&
    (daysSinceCheckIn === null ? daysSinceStart > checkInIntervalDays : daysSinceCheckIn > checkInIntervalDays)

  return (
    <div
      className={`card p-4 ${placement.status !== 'ACTIVE' ? 'opacity-75' : ''} ${
        isCheckInOverdue ? 'border-l-4 border-l-orange-400' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Resident */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-aoz-primary text-white rounded-full flex items-center justify-center font-medium">
              {placement.resident.code.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <Link
                href={`/residents/${placement.residentId}`}
                className="font-medium text-gray-900 hover:text-aoz-primary"
              >
                {placement.resident.code}
              </Link>
              {supportLevel !== 'STANDARD' && (
                <p className="text-xs text-orange-600">
                  {getLabel(SUPPORT_LEVEL_LABELS, supportLevel)}
                </p>
              )}
            </div>
          </div>

          <span className="text-gray-400">→</span>

          {/* Housing */}
          <div>
            <Link
              href={`/housing/${placement.housingUnitId}`}
              className="font-medium text-gray-900 hover:text-aoz-primary"
            >
              {placement.housingUnit.code}
            </Link>
            <p className="text-sm text-gray-500">
              {placement.housingUnit.address}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Duration */}
          <div className="text-right">
            <p className="text-xs text-gray-500">
              {placement.status === 'ACTIVE' ? 'Seit' : 'Aufenthalt'}
            </p>
            <p className="font-medium text-gray-900">
              {totalDuration} {totalDuration === 1 ? 'Tag' : 'Tage'}
            </p>
          </div>

          {/* Check-in Status for Active Placements */}
          {placement.status === 'ACTIVE' && (
            <Link
              href={`/placements/${placement.id}/checkin`}
              className={`text-right px-3 py-2 rounded-lg transition-colors ${
                isCheckInOverdue
                  ? 'bg-orange-100 hover:bg-orange-200'
                  : 'hover:bg-gray-50'
              }`}
            >
              <p className="text-xs text-gray-500">Check-in</p>
              {lastCheckIn ? (
                <div className="flex items-center gap-2">
                  <span className="text-lg">{SATISFACTION_EMOJIS[lastCheckIn.overallSatisfaction - 1]}</span>
                  <span className={`text-xs ${isCheckInOverdue ? 'text-orange-600 font-medium' : 'text-gray-400'}`}>
                    vor {daysSinceCheckIn}d
                  </span>
                </div>
              ) : (
                <p className={`text-sm font-medium ${isCheckInOverdue ? 'text-orange-600' : 'text-aoz-primary'}`}>
                  {isCheckInOverdue ? 'Überfällig!' : 'Erfassen →'}
                </p>
              )}
            </Link>
          )}

          {/* Last satisfaction for ended placements */}
          {placement.status !== 'ACTIVE' && placement.satisfactionRating && (
            <div className="text-right">
              <p className="text-xs text-gray-500">Zufriedenheit</p>
              <p className="text-lg">{SATISFACTION_EMOJIS[placement.satisfactionRating - 1]}</p>
            </div>
          )}

          {/* Status / End Reason */}
          <div className="text-right">
            {placement.status === 'ACTIVE' ? (
              <span className={`badge ${getStatusBadgeClass(placement.status)}`}>
                {getLabel(PLACEMENT_STATUS_LABELS, placement.status)}
              </span>
            ) : (
              <div>
                <span className={`badge ${getStatusBadgeClass(placement.status)}`}>
                  {getLabel(PLACEMENT_STATUS_LABELS, placement.status)}
                </span>
                {placement.endReason && (
                  <p className="text-xs text-gray-500 mt-1">
                    {getLabel(END_REASON_LABELS, placement.endReason)}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Concerns Alert */}
      {lastCheckIn?.concerns && (
        <div className="mt-3 p-2 bg-orange-50 rounded text-sm text-orange-700 border-t border-orange-100">
          ⚠️ Anliegen: {lastCheckIn.concerns.slice(0, 100)}{lastCheckIn.concerns.length > 100 ? '...' : ''}
        </div>
      )}

      {/* Dates */}
      <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 border-t border-gray-100 pt-3">
        <span>Start: {formatDate(placement.startDate)}</span>
        {placement.endDate && <span>Ende: {formatDate(placement.endDate)}</span>}
      </div>
    </div>
  )
}
