import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import { EMPTY_STATE_LABELS, RESIDENT_LIST_LABELS, UI_LABELS, RESIDENT_STATUS_LABELS, RESIDENT_STAT_LABELS } from '@/lib/constants'

export const metadata: Metadata = { title: 'Bewohner' }
import { getDateDaysAgo } from '@/lib/utils'
import { StatCard } from '@/components/ui/Card'
import { ResidentsList } from '@/components/residents/ResidentsList'
import { RESIDENT_NAME_SELECT } from '@/lib/utils/resident-name'
import { TabLink, TabLinkGroup } from '@/components/ui/Tabs'
import { CSVImport } from '@/components/residents/CSVImport'
import { ButtonLink } from '@/components/ui/Button'
import { EmptyState, PageHeader, PageShell, Toolbar } from '@/components/ui/Page'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ view?: string; q?: string }>
}

export default async function ResidentsListPage({ searchParams }: Props) {
  const params = await searchParams
  const view = params.view || 'active'
  const q = params.q?.trim() || ''

  const [residents, statusGroups, unplacedCount] = await Promise.all([
    prisma.resident.findMany({
      where: {
        ...(view === 'active' ? { status: { in: ['ACTIVE', 'PLACED'] } } : view === 'archived' ? { status: 'EXITED' } : {}),
        ...(q ? { code: { contains: q, mode: 'insensitive' } } : {}),
      },
      select: {
        ...RESIDENT_NAME_SELECT,
        ageRange: true,
        gender: true,
        status: true,
        languages: true,
        createdAt: true,
        placements: {
          where: { status: 'ACTIVE' },
          select: {
            housingUnit: {
              select: { code: true },
            },
          },
        },
        _count: {
          select: {
            incidentsAsSubject: {
              where: {
                date: { gte: getDateDaysAgo(30) },
                category: 'INTERPERSONAL',
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    // Aggregate tab counts by status (single query instead of fetching all rows)
    prisma.resident.groupBy({
      by: ['status'],
      _count: { _all: true },
    }),
    // Count of ACTIVE residents with no active placement (separate query — groupBy can't express this)
    prisma.resident.count({
      where: {
        status: 'ACTIVE',
        placements: { none: { status: 'ACTIVE' } },
      },
    }),
  ])

  const statusCounts = statusGroups.reduce<Record<string, number>>((acc, g) => {
    acc[g.status] = g._count._all
    return acc
  }, {})

  const stats = {
    total: statusGroups.reduce((sum, g) => sum + g._count._all, 0),
    active: statusCounts.ACTIVE ?? 0,
    placed: statusCounts.PLACED ?? 0,
    archived: statusCounts.EXITED ?? 0,
    unplaced: unplacedCount,
    visible: residents.length,
  }

  return (
    <PageShell>
      <PageHeader
        title={RESIDENT_LIST_LABELS.title}
        description={`${stats.visible} sichtbar · ${stats.unplaced} ohne Platzierung`}
        actions={
          <>
            <ButtonLink href="/api/export/residents" variant="outline">
              {RESIDENT_LIST_LABELS.export}
            </ButtonLink>
            <ButtonLink href="/residents/new">
              {RESIDENT_LIST_LABELS.addResident}
            </ButtonLink>
          </>
        }
      />

      <Toolbar>
        <form method="GET" action="/residents" className="flex-1">
          <input type="hidden" name="view" value={view} />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder={RESIDENT_LIST_LABELS.searchPlaceholder}
            className="input w-full md:max-w-sm"
            autoComplete="off"
          />
        </form>
        <TabLinkGroup label={UI_LABELS.filterNav}>
          <TabLink href={`/residents?view=active${q ? `&q=${encodeURIComponent(q)}` : ''}`} label={UI_LABELS.active} count={stats.active + stats.placed} active={view === 'active'} />
          <TabLink href={`/residents?view=archived${q ? `&q=${encodeURIComponent(q)}` : ''}`} label={UI_LABELS.archived} count={stats.archived} active={view === 'archived'} />
          <TabLink href={`/residents?view=all${q ? `&q=${encodeURIComponent(q)}` : ''}`} label={UI_LABELS.all} count={stats.total} active={view === 'all'} />
        </TabLinkGroup>
      </Toolbar>

      {view !== 'archived' && stats.unplaced > 0 && (
        <div className="rounded-lg border border-ui-border bg-ui-surface p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="font-medium text-ui-text">
              {stats.unplaced} {RESIDENT_LIST_LABELS.unplacedBannerSuffix}
            </p>
            <p className="text-sm text-ui-muted">
              {RESIDENT_LIST_LABELS.unplacedBannerDesc}
            </p>
          </div>
          <ButtonLink href="/matching" variant="secondary">
            {RESIDENT_LIST_LABELS.startMatching}
          </ButtonLink>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label={UI_LABELS.total} value={stats.total} />
        <StatCard label={UI_LABELS.active} value={stats.active} />
        <StatCard label={RESIDENT_STATUS_LABELS.PLACED} value={stats.placed} />
        <StatCard
          label={RESIDENT_STAT_LABELS.unplaced}
          value={stats.unplaced}
          trend={stats.unplaced > 0 ? 'warning' : 'neutral'}
        />
      </div>

      <CSVImport />

      {residents.length === 0 ? (
        <EmptyState
          title={
            q
              ? `${RESIDENT_LIST_LABELS.emptyFiltered} («${q}»)`
              : view === 'archived'
                ? RESIDENT_LIST_LABELS.emptyArchived
                : EMPTY_STATE_LABELS.noResidents
          }
          action={
            q ? (
              <ButtonLink href={`/residents?view=${view}`} variant="outline">
              {RESIDENT_LIST_LABELS.filterReset}
              </ButtonLink>
          ) : view !== 'archived' ? (
              <ButtonLink href="/residents/new">
              {RESIDENT_LIST_LABELS.emptyFirst}
              </ButtonLink>
            ) : null
          }
        />
      ) : (
        <ResidentsList residents={residents.map(r => ({
          ...r,
          incidentCount: r._count.incidentsAsSubject,
        }))} />
      )}
    </PageShell>
  )
}
