import { prisma } from '@/lib/db'
import Link from 'next/link'
import { StatCard } from '@/components/ui/Card'
import { getDateDaysAgo } from '@/lib/utils'
import { EMPTY_STATE_LABELS } from '@/lib/constants'
import { HousingList } from '@/components/housing/HousingList'

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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
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
        <HousingList units={units} />
      )}
    </div>
  )
}
