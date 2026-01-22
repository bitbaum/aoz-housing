import { prisma } from '@/lib/db'
import Link from 'next/link'
import {
  PLACEMENT_STATUS_LABELS,
  END_REASON_LABELS,
  SATISFACTION_EMOJIS,
  getLabel,
} from '@/lib/constants'
import {
  getStatusBadgeClass,
  getScoreLabel,
  getScoreColorClass,
  getScoreBgClass,
  formatDate,
} from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function PlacementsListPage() {
  const placements = await prisma.placement.findMany({
    include: {
      resident: true,
      housingUnit: true,
    },
    orderBy: { startDate: 'desc' },
    take: 200,
  })

  const activePlacements = placements.filter((p) => p.status === 'ACTIVE')
  const endedPlacements = placements.filter((p) => p.status !== 'ACTIVE')

  const stats = {
    total: placements.length,
    active: activePlacements.length,
    ended: endedPlacements.length,
    avgSatisfaction:
      placements.filter((p) => p.satisfactionRating).length > 0
        ? Math.round(
            placements
              .filter((p) => p.satisfactionRating)
              .reduce((sum, p) => sum + (p.satisfactionRating || 0), 0) /
              placements.filter((p) => p.satisfactionRating).length
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
          <TabButton label="Aktiv" count={activePlacements.length} active />
          <TabButton label="Beendet" count={endedPlacements.length} />
        </div>
      </div>

      {/* Placements List */}
      {placements.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-4">Keine Platzierungen vorhanden</p>
          <Link href="/matching" className="btn-primary">
            Erste Platzierung erstellen
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {activePlacements.map((placement) => (
            <PlacementRow key={placement.id} placement={placement} />
          ))}
          {endedPlacements.length > 0 && activePlacements.length > 0 && (
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h3 className="text-sm font-medium text-gray-500 mb-3">
                Beendete Platzierungen
              </h3>
            </div>
          )}
          {endedPlacements.map((placement) => (
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

function TabButton({
  label,
  count,
  active = false,
}: {
  label: string
  count: number
  active?: boolean
}) {
  return (
    <button
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
    </button>
  )
}

function PlacementRow({ placement }: { placement: any }) {
  const duration = placement.endDate
    ? Math.ceil(
        (new Date(placement.endDate).getTime() -
          new Date(placement.startDate).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : Math.ceil(
        (Date.now() - new Date(placement.startDate).getTime()) /
          (1000 * 60 * 60 * 24)
      )

  return (
    <div
      className={`card p-4 ${
        placement.status !== 'ACTIVE' ? 'opacity-75' : ''
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
          {/* Compatibility Score */}
          {placement.compatibilityScore && (
            <div className="text-right">
              <p className="text-xs text-gray-500">Kompatibilität</p>
              <p
                className={`font-medium ${getScoreColorClass(
                  placement.compatibilityScore
                )}`}
              >
                {Math.round(placement.compatibilityScore)}%
              </p>
            </div>
          )}

          {/* Duration */}
          <div className="text-right">
            <p className="text-xs text-gray-500">Dauer</p>
            <p className="font-medium text-gray-900">{duration} Tage</p>
          </div>

          {/* Satisfaction */}
          {placement.satisfactionRating && (
            <div className="text-right">
              <p className="text-xs text-gray-500">Zufriedenheit</p>
              <p className="text-lg">
                {SATISFACTION_EMOJIS[placement.satisfactionRating - 1]}
              </p>
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

      {/* Dates */}
      <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 border-t border-gray-100 pt-3">
        <span>Start: {formatDate(placement.startDate)}</span>
        {placement.endDate && <span>Ende: {formatDate(placement.endDate)}</span>}
        {placement.placementNotes && (
          <span className="text-gray-400">· {placement.placementNotes}</span>
        )}
      </div>
    </div>
  )
}
