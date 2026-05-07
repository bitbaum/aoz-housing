import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { EMPTY_STATE_LABELS } from '@/lib/constants'

export const metadata: Metadata = { title: 'Bewohner' }
import { getDateDaysAgo } from '@/lib/utils'
import { StatCard } from '@/components/ui/Card'
import { ResidentsList } from '@/components/residents/ResidentsList'
import { TabLink } from '@/components/ui/Tabs'
import { CSVImport } from '@/components/residents/CSVImport'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ view?: string }>
}

export default async function ResidentsListPage({ searchParams }: Props) {
  const params = await searchParams
  const view = params.view || 'active'

  const [residents, allResidents] = await Promise.all([
    prisma.resident.findMany({
      where: view === 'active'
        ? { status: { in: ['ACTIVE', 'PLACED'] } }
        : view === 'archived'
        ? { status: 'EXITED' }
        : undefined,
      select: {
        id: true,
        code: true,
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
    prisma.resident.findMany({
      select: {
        status: true,
        placements: {
          where: { status: 'ACTIVE' },
          select: { id: true },
        },
      },
    }),
  ])

  const stats = {
    total: allResidents.length,
    active: allResidents.filter((r) => r.status === 'ACTIVE').length,
    placed: allResidents.filter((r) => r.status === 'PLACED').length,
    archived: allResidents.filter((r) => r.status === 'EXITED').length,
    unplaced: allResidents.filter(
      (r) => r.status === 'ACTIVE' && r.placements.length === 0
    ).length,
    visible: residents.length,
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Bewohner</h1>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/api/export/residents"
            className="min-h-[44px] rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 inline-flex items-center"
          >
            Exportieren
          </a>
          <Link href="/residents/new" className="btn-ghost">
            <span className="mr-1">+</span> Bewohner
          </Link>
        </div>
      </div>

      {/* CSV Import */}
      <div className="mb-6">
        <CSVImport />
      </div>

      <div className="mb-4">
        <div className="flex gap-2 border-b border-gray-200" role="tablist">
          <TabLink href="/residents?view=active" label="Aktiv" count={stats.active + stats.placed} active={view === 'active'} />
          <TabLink href="/residents?view=archived" label="Archiviert" count={stats.archived} active={view === 'archived'} />
          <TabLink href="/residents?view=all" label="Alle" count={stats.total} active={view === 'all'} />
        </div>
      </div>

      {/* Contextual Action Banner */}
      {view !== 'archived' && stats.unplaced > 0 && (
        <div className="mb-4 sm:mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="font-medium text-blue-800">
              {stats.unplaced} Bewohner warten auf Platzierung
            </p>
            <p className="text-sm text-blue-600">
              Starten Sie den Matching-Prozess um passende Unterkünfte zu finden
            </p>
          </div>
          <Link href="/matching" className="btn-primary text-center min-h-[44px] flex items-center justify-center">
            Matching starten
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <StatCard label="Gesamt" value={stats.total} />
        <StatCard label="Aktiv" value={stats.active} />
        <StatCard label="Platziert" value={stats.placed} />
        <StatCard
          label="Unplatziert"
          value={stats.unplaced}
          trend={stats.unplaced > 0 ? 'warning' : 'neutral'}
        />
      </div>

      {/* Resident List */}
      {residents.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-4">
            {view === 'archived' ? 'Keine archivierten Bewohner' : EMPTY_STATE_LABELS.noResidents}
          </p>
          {view !== 'archived' && (
            <Link href="/residents/new" className="btn-primary">
              Ersten Bewohner erfassen
            </Link>
          )}
        </div>
      ) : (
        <ResidentsList residents={residents.map(r => ({
          ...r,
          incidentCount: r._count.incidentsAsSubject,
        }))} />
      )}
    </div>
  )
}
