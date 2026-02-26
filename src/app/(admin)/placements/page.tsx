import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import {
  PLACEMENT_STATUS_LABELS,
  END_REASON_LABELS,
  SATISFACTION_EMOJIS,
  SUPPORT_LEVEL_LABELS,
  getLabel,
} from '@/lib/constants'

import { DISPLAY_LIMITS } from '@/lib/config/thresholds'

export const metadata: Metadata = { title: 'Platzierungen' }
import {
  getStatusBadgeClass,
  formatDate,
} from '@/lib/utils'
import { StatCard } from '@/components/ui/Card'
import { TabLink } from '@/components/ui/Tabs'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ status?: string; q?: string; overdue?: string; conflicts?: string }>
}

export default async function PlacementsListPage({ searchParams }: Props) {
  const params = await searchParams
  const statusFilter = params.status || 'active'
  const query = (params.q || '').trim().toLowerCase()
  const overdueOnly = params.overdue === '1'
  const conflictsOnly = params.conflicts === '1'

  const placements = await prisma.placement.findMany({
    where: statusFilter === 'active'
      ? { status: 'ACTIVE' }
      : statusFilter === 'ended'
      ? { status: { not: 'ACTIVE' } }
      : undefined,
    select: {
      id: true,
      status: true,
      startDate: true,
      endDate: true,
      satisfactionRating: true,
      endReason: true,
      residentId: true,
      housingUnitId: true,
      resident: {
        select: { code: true, supportLevel: true },
      },
      housingUnit: {
        select: { code: true, address: true },
      },
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

  const filteredPlacements = placements.filter((placement) => {
    const matchesQuery = !query ||
      placement.resident.code.toLowerCase().includes(query) ||
      placement.housingUnit.code.toLowerCase().includes(query) ||
      placement.housingUnit.address.toLowerCase().includes(query)

    const lastCheckIn = placement.checkIns?.[0]
    const daysSinceCheckIn = lastCheckIn
      ? Math.ceil((Date.now() - new Date(lastCheckIn.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      : null
    const supportLevel = placement.resident.supportLevel || 'STANDARD'
    const checkInIntervalDays = supportLevel === 'INTENSIVE' ? 7 : supportLevel === 'ELEVATED' ? 14 : 28
    const isOverdue = placement.status === 'ACTIVE' &&
      (daysSinceCheckIn === null
        ? Math.ceil((Date.now() - new Date(placement.startDate).getTime()) / (1000 * 60 * 60 * 24)) > checkInIntervalDays
        : daysSinceCheckIn > checkInIntervalDays)

    const matchesOverdue = !overdueOnly || isOverdue
    const matchesConflicts = !conflictsOnly || placement.endReason === 'CONFLICT'

    return matchesQuery && matchesOverdue && matchesConflicts
  })

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Platzierungen</h1>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/api/export/placements"
            className="min-h-[44px] rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 inline-flex items-center"
          >
            Exportieren
          </a>
          <Link href="/matching" className="btn-primary">
            Neue Platzierung
          </Link>
        </div>
      </div>

      {/* Search & Quick Filters */}
      <form className="mb-4 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
        <input type="hidden" name="status" value={statusFilter} />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="search"
            name="q"
            defaultValue={params.q || ''}
            placeholder="Suchen: Bewohner, Unterkunft, Adresse"
            className="input md:col-span-2"
          />
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" name="overdue" value="1" defaultChecked={overdueOnly} />
            Nur überfällige Check-ins
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" name="conflicts" value="1" defaultChecked={conflictsOnly} />
            Nur konfliktbedingt beendet
          </label>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <button type="submit" className="btn-outline text-sm">Filter anwenden</button>
          <Link href={`/placements?status=${statusFilter}`} className="text-sm text-gray-500 hover:text-gray-700">
            Filter zurücksetzen
          </Link>
        </div>
      </form>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
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
          trend={stats.conflictEnds > 0 ? 'warning' : 'neutral'}
        />
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex gap-2 border-b border-gray-200" role="tablist">
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
      {filteredPlacements.length === 0 ? (
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
          {filteredPlacements.map((placement) => (
            <PlacementRow key={placement.id} placement={placement} />
          ))}
        </div>
      )}
    </div>
  )
}

interface PlacementRowData {
  id: string
  status: string
  startDate: Date | string
  endDate: Date | string | null
  satisfactionRating: number | null
  endReason: string | null
  residentId: string
  housingUnitId: string
  resident: { code: string; supportLevel: string | null }
  housingUnit: { code: string; address: string }
  checkIns: {
    createdAt: Date | string
    overallSatisfaction: number
    concerns: string | null
  }[]
}

function PlacementRow({ placement }: { placement: PlacementRowData }) {
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
                  <span className={`text-xs ${isCheckInOverdue ? 'text-orange-600 font-medium' : 'text-gray-500'}`}>
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
          ⚠️ Anliegen: {lastCheckIn.concerns.slice(0, DISPLAY_LIMITS.emailSummary)}{lastCheckIn.concerns.length > DISPLAY_LIMITS.emailSummary ? '...' : ''}
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
