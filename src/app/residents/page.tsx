import { prisma } from '@/lib/db'
import Link from 'next/link'
import {
  AGE_RANGE_LABELS,
  GENDER_LABELS_SHORT,
  RESIDENT_STATUS_LABELS,
  LANGUAGE_LABELS,
  getLabel,
} from '@/lib/constants'
import { getStatusBadgeClass } from '@/lib/utils'
import { StatCard } from '@/components/ui/Card'

export const dynamic = 'force-dynamic'

export default async function ResidentsListPage() {
  const residents = await prisma.resident.findMany({
    include: {
      placements: {
        where: { status: 'ACTIVE' },
        include: {
          housingUnit: true,
        },
      },
      incidentsAsSubject: {
        where: {
          date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          category: 'INTERPERSONAL',
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const stats = {
    total: residents.length,
    active: residents.filter((r) => r.status === 'ACTIVE').length,
    placed: residents.filter((r) => r.status === 'PLACED').length,
    unplaced: residents.filter(
      (r) => r.status === 'ACTIVE' && r.placements.length === 0
    ).length,
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Bewohner</h1>
        <Link href="/residents/new" className="btn-primary">
          Neuer Bewohner
        </Link>
      </div>

      {/* Contextual Action Banner */}
      {stats.unplaced > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
          <div>
            <p className="font-medium text-blue-800">
              {stats.unplaced} Bewohner warten auf Platzierung
            </p>
            <p className="text-sm text-blue-600">
              Starten Sie den Matching-Prozess um passende Unterkünfte zu finden
            </p>
          </div>
          <Link href="/matching" className="btn-primary">
            Matching starten
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
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
          <p className="text-gray-500 mb-4">Keine Bewohner erfasst</p>
          <Link href="/residents/new" className="btn-primary">
            Ersten Bewohner erfassen
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {residents.map((resident) => (
            <ResidentCard key={resident.id} resident={resident} />
          ))}
        </div>
      )}
    </div>
  )
}

function ResidentCard({ resident }: { resident: any }) {
  const currentPlacement = resident.placements[0]
  const recentIncidents = resident.incidentsAsSubject?.length || 0

  const languages = resident.languages
    .slice(0, 3)
    .map((lang: string) => getLabel(LANGUAGE_LABELS, lang, lang))
    .join(', ')

  return (
    <Link href={`/residents/${resident.id}`} className="card-hover">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-aoz-primary text-white rounded-full flex items-center justify-center font-medium">
            {resident.code.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{resident.code}</h3>
            <p className="text-sm text-gray-500">
              {getLabel(AGE_RANGE_LABELS, resident.ageRange)} ·{' '}
              {getLabel(GENDER_LABELS_SHORT, resident.gender)}
            </p>
          </div>
        </div>
        <span className={`badge ${getStatusBadgeClass(resident.status)}`}>
          {getLabel(RESIDENT_STATUS_LABELS, resident.status)}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        {currentPlacement ? (
          <div className="flex items-center gap-2 text-gray-600">
            <span>🏠</span>
            <span>{currentPlacement.housingUnit.code}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-orange-600">
            <span>⚠️</span>
            <span>Nicht platziert</span>
          </div>
        )}

        {languages && (
          <div className="flex items-center gap-2 text-gray-600">
            <span>🗣️</span>
            <span>{languages}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100">
        <span className="text-xs text-gray-400">
          Erfasst:{' '}
          {new Date(resident.createdAt).toLocaleDateString('de-CH')}
        </span>
        {recentIncidents > 0 && (
          <span className="text-xs text-orange-600">
            {recentIncidents} Vorfälle
          </span>
        )}
      </div>
    </Link>
  )
}
