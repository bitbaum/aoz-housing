import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import { StatCard } from '@/components/ui/Card'
import { getDateDaysAgo } from '@/lib/utils'

export const metadata: Metadata = { title: 'Unterkünfte' }
import { EMPTY_STATE_LABELS, UI_LABELS, HOUSING_STATUS_LABELS, HOUSING_STAT_LABELS, PAGE_TITLES, HOUSING_LIST_LABELS } from '@/lib/constants'
import { HousingList } from '@/components/housing/HousingList'
import { TabLink } from '@/components/ui/Tabs'
import { ButtonLink } from '@/components/ui/Button'
import { EmptyState, PageHeader, PageShell, Toolbar } from '@/components/ui/Page'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ view?: string; q?: string }>
}

export default async function HousingListPage({ searchParams }: Props) {
  const params = await searchParams
  const view = params.view || 'active'
  const q = params.q?.trim() || ''

  const [units, allUnits] = await Promise.all([
    prisma.housingUnit.findMany({
      where: {
        ...(view === 'active'
          ? { status: { in: ['AVAILABLE', 'FULL', 'MAINTENANCE'] } }
          : view === 'archived'
          ? { status: 'CLOSED' }
          : {}),
        ...(q ? { OR: [
          { code: { contains: q, mode: 'insensitive' } },
          { address: { contains: q, mode: 'insensitive' } },
        ] } : {}),
      },
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
    <PageShell>
      <PageHeader
        title={PAGE_TITLES.housing}
        description={`${stats.visible} sichtbar · ${stats.occupiedBeds}/${stats.totalBeds} Betten belegt`}
        actions={
          <ButtonLink href="/housing/new">
            {PAGE_TITLES.newHousing}
          </ButtonLink>
        }
      />

      <Toolbar>
        <form method="GET" action="/housing" className="flex-1">
          <input type="hidden" name="view" value={view} />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder={HOUSING_LIST_LABELS.searchPlaceholder}
            className="input w-full md:max-w-sm"
            autoComplete="off"
          />
        </form>
        <div className="flex gap-1 overflow-x-auto rounded-lg border border-ui-border bg-ui-surface p-1" role="tablist">
          <TabLink href={`/housing?view=active${q ? `&q=${encodeURIComponent(q)}` : ''}`} label={UI_LABELS.active} count={stats.total - stats.archived} active={view === 'active'} />
          <TabLink href={`/housing?view=archived${q ? `&q=${encodeURIComponent(q)}` : ''}`} label={UI_LABELS.archived} count={stats.archived} active={view === 'archived'} />
          <TabLink href={`/housing?view=all${q ? `&q=${encodeURIComponent(q)}` : ''}`} label={UI_LABELS.all} count={stats.total} active={view === 'all'} />
        </div>
      </Toolbar>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label={HOUSING_STAT_LABELS.total} value={stats.total} />
        <StatCard label={HOUSING_STATUS_LABELS.AVAILABLE} value={stats.available} />
        <StatCard label={HOUSING_STATUS_LABELS.FULL} value={stats.full} />
        <StatCard
          label={HOUSING_STAT_LABELS.occupancy}
          value={`${stats.occupiedBeds}/${stats.totalBeds}`}
          subtitle={`${occupancyPercent}%`}
        />
      </div>

      {units.length === 0 ? (
        <EmptyState
          title={
            q
              ? `${HOUSING_LIST_LABELS.emptyFiltered} («${q}»)`
              : view === 'archived'
                ? EMPTY_STATE_LABELS.noHousingArchived
                : EMPTY_STATE_LABELS.noHousing
          }
          action={
            q ? (
              <ButtonLink href={`/housing?view=${view}`} variant="outline">
              {HOUSING_LIST_LABELS.filterReset}
              </ButtonLink>
          ) : view !== 'archived' ? (
              <ButtonLink href="/housing/new">
              {EMPTY_STATE_LABELS.createHousingFirst}
              </ButtonLink>
            ) : null
          }
        />
      ) : (
        <HousingList units={units.map(u => ({
          ...u,
          placementCount: u._count.placements,
          incidentCount: u._count.incidents,
        }))} />
      )}
    </PageShell>
  )
}
