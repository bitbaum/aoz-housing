import { prisma } from '@/lib/db'
import Link from 'next/link'
import { StatCard } from '@/components/ui/Card'
import { getDateDaysAgo } from '@/lib/utils'
import { EMPTY_STATE_LABELS } from '@/lib/constants'
import { HousingCardActions } from '@/components/housing/HousingCardActions'

export const dynamic = 'force-dynamic'

export default async function HousingListPage() {
  const units = await prisma.housingUnit.findMany({
    include: {
      placements: {
        where: { status: 'ACTIVE' },
      },
      incidents: {
        where: {
          date: { gte: getDateDaysAgo(30) },
          category: 'INTERPERSONAL',
        },
      },
    },
    orderBy: { code: 'asc' },
  })

  const stats = {
    total: units.length,
    available: units.filter(u => u.status === 'AVAILABLE').length,
    full: units.filter(u => u.status === 'FULL').length,
    totalBeds: units.reduce((sum, u) => sum + u.totalBeds, 0),
    occupiedBeds: units.reduce((sum, u) => sum + u.placements.length, 0),
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Unterkünfte</h1>
        <Link href="/housing/new" className="btn-primary">
          Neue Unterkunft
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Unterkünfte" value={stats.total} />
        <StatCard label="Verfügbar" value={stats.available} />
        <StatCard label="Voll belegt" value={stats.full} />
        <StatCard
          label="Belegung"
          value={`${stats.occupiedBeds}/${stats.totalBeds}`}
          subtitle={`${Math.round((stats.occupiedBeds / stats.totalBeds) * 100) || 0}%`}
        />
      </div>

      {/* Unit List */}
      {units.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-4">{EMPTY_STATE_LABELS.noHousing}</p>
          <Link href="/housing/new" className="btn-primary">
            Erste Unterkunft erstellen
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {units.map((unit) => (
            <UnitCard key={unit.id} unit={unit} />
          ))}
        </div>
      )}
    </div>
  )
}

function UnitCard({ unit }: { unit: any }) {
  const occupancy = unit.placements.length
  const occupancyPercent = Math.round((occupancy / unit.totalBeds) * 100)
  const recentConflicts = unit.incidents.length

  const statusConfig: Record<string, { label: string; class: string }> = {
    AVAILABLE: { label: 'Verfügbar', class: 'badge-active' },
    FULL: { label: 'Voll', class: 'badge-pending' },
    MAINTENANCE: { label: 'Wartung', class: 'badge-alert' },
    CLOSED: { label: 'Geschlossen', class: 'badge-ended' },
  }
  const statusInfo = statusConfig[unit.status] || statusConfig.AVAILABLE

  // Simple harmony indicator based on recent conflicts
  const harmonyColor = recentConflicts === 0 ? 'bg-green-500' :
                       recentConflicts <= 2 ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <div className="card-hover relative">
      <div className="absolute top-3 right-3 z-10">
        <HousingCardActions housingId={unit.id} />
      </div>
      <Link href={`/housing/${unit.id}`} className="block">
        <div className="flex items-start justify-between mb-3 pr-8">
          <div>
            <h3 className="font-semibold text-gray-900">{unit.code}</h3>
            <p className="text-sm text-gray-500">{unit.address}</p>
          </div>
          <span className={`badge ${statusInfo.class}`}>{statusInfo.label}</span>
        </div>

        <div className="flex items-center gap-4 mb-3">
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-500">Belegung</span>
              <span className="font-medium">{occupancy}/{unit.totalBeds}</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${occupancyPercent >= 90 ? 'bg-red-500' : occupancyPercent >= 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                style={{ width: `${occupancyPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>{unit.totalRooms} Zimmer</span>
            {unit.wheelchairAccess && <span title="Rollstuhlgerecht">♿</span>}
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${harmonyColor}`} title="Harmoniestatus" />
            {recentConflicts > 0 && (
              <span className="text-sm text-gray-500">
                {recentConflicts} Konflikte
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  )
}
