import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { StatCard } from '@/components/ui/Card'
import { getDateDaysAgo } from '@/lib/utils'

export const metadata: Metadata = { title: 'Unterkünfte' }
import { EMPTY_STATE_LABELS, UI_LABELS, HOUSING_STATUS_LABELS, HOUSING_STAT_LABELS } from '@/lib/constants'
import { HousingList } from '@/components/housing/HousingList'
import { TabLink } from '@/components/ui/Tabs'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ view?: string }>
}

export default async function HousingListPage({ searchParams }: Props) {
  const params = await searchParams
  const view = params.view || 'active'

  const [units, allUnits] = await Promise.all([
    prisma.housingUnit.findMany({
      where: view === 'active'
        ? { status: { in: ['AVAILABLE', 'FULL', 'MAINTENANCE'] } }
        : view === 'archived'
        ? { status: 'CLOSED' }
        : undefined,
      select: {
        id: true,
        code: true,
        address: true,
        status: true,
        totalBeds: true,
        totalRooms: true,
        wheelchairAccess: true,
        _count: {
          select: {
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
        },
      },
      orderBy: { code: 'asc' },
    }),
    // Unfiltered for tab counts and stats
    prisma.housingUnit.findMany({
      select: {
        status: true,
        totalBeds: true,
        _count: {
          select: { placements: { where: { status: 'ACTIVE' } } },
        },
      },
    }),
  ])

  const stats = {
    total: allUnits.length,
    available: allUnits.filter(u => u.status === 'AVAILABLE').length,
    full: allUnits.filter(u => u.status === 'FULL').length,
    archived: allUnits.filter(u => u.status === 'CLOSED').length,
    totalBeds: allUnits.reduce((sum, u) => sum + u.totalBeds, 0),
    occupiedBeds: allUnits.reduce((sum, u) => sum + u._count.placements, 0),
    visible: units.length,
  }
  const occupancyPercent = stats.totalBeds > 0
    ? Math.max(0, Math.min(100, Math.round((stats.occupiedBeds / stats.totalBeds) * 100)))
    : 0

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Unterkünfte</h1>
        <Link href="/housing/new" className="btn-primary">
          Neue Unterkunft
        </Link>
      </div>

      <div className="mb-4">
        <div className="flex gap-2 border-b border-gray-200" role="tablist">
          <TabLink href="/housing?view=active" label={UI_LABELS.active} count={stats.total - stats.archived} active={view === 'active'} />
          <TabLink href="/housing?view=archived" label={UI_LABELS.archived} count={stats.archived} active={view === 'archived'} />
          <TabLink href="/housing?view=all" label={UI_LABELS.all} count={stats.total} active={view === 'all'} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <StatCard label={HOUSING_STAT_LABELS.total} value={stats.total} />
        <StatCard label={HOUSING_STATUS_LABELS.AVAILABLE} value={stats.available} />
        <StatCard label={HOUSING_STATUS_LABELS.FULL} value={stats.full} />
        <StatCard
          label="Belegung"
          value={`${stats.occupiedBeds}/${stats.totalBeds}`}
          subtitle={`${occupancyPercent}%`}
        />
      </div>

      {/* Unit List */}
      {units.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-4">
            {view === 'archived' ? 'Keine archivierten Unterkünfte' : EMPTY_STATE_LABELS.noHousing}
          </p>
          {view !== 'archived' && (
            <Link href="/housing/new" className="btn-primary">
              Erste Unterkunft erstellen
            </Link>
          )}
        </div>
      ) : (
        <HousingList units={units.map(u => ({
          ...u,
          placementCount: u._count.placements,
          incidentCount: u._count.incidents,
        }))} />
      )}
    </div>
  )
}
