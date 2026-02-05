'use client'

import Link from 'next/link'

interface HotspotUnit {
  id: string
  code: string
  conflicts: number
  occupancy: string // e.g., "5/5"
}

interface ConflictCardProps {
  activeConflicts: number
  recentConflicts: number // last 7 days
  hotspotUnits: HotspotUnit[]
  oldestConflictDays?: number
}

export function ConflictCard({
  activeConflicts,
  recentConflicts,
  hotspotUnits,
  oldestConflictDays,
}: ConflictCardProps) {
  const hasConflicts = activeConflicts > 0
  const hasHotspots = hotspotUnits.length > 0

  const getConflictColor = (count: number): string => {
    if (count === 0) return 'text-green-600'
    if (count <= 2) return 'text-yellow-600'
    if (count <= 5) return 'text-orange-600'
    return 'text-red-600'
  }

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Konflikte</h2>

      {/* Main stat */}
      <Link href="/incidents?category=INTERPERSONAL" className="block mb-4 group">
        <div className="flex items-baseline gap-2">
          <span className={`text-3xl font-bold ${getConflictColor(activeConflicts)}`}>
            {activeConflicts}
          </span>
          <span className="text-gray-500 text-sm">aktiv (30 Tage)</span>
        </div>
        {oldestConflictDays !== undefined && activeConflicts > 0 && (
          <p className="text-sm text-gray-500 mt-1 group-hover:text-gray-700">
            Ältester: {oldestConflictDays} Tage ungelöst
          </p>
        )}
      </Link>

      {/* Hotspot units */}
      {hasHotspots && (
        <div className="border-t border-gray-100 pt-4 mt-4">
          <p className="text-sm font-medium text-gray-700 mb-3">Brennpunkte</p>
          <div className="space-y-2">
            {hotspotUnits.slice(0, 3).map((unit) => (
              <Link
                key={unit.id}
                href={`/housing/${unit.id}`}
                className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div>
                  <span className="font-medium text-gray-900 text-sm">{unit.code}</span>
                  <span className="text-gray-500 text-sm ml-2">{unit.occupancy} belegt</span>
                </div>
                <span className="text-sm text-orange-600 font-medium">
                  {unit.conflicts} Konflikte
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent trend */}
      <div className="border-t border-gray-100 pt-4 mt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Letzte 7 Tage</span>
          <span className={recentConflicts === 0 ? 'text-green-600' : 'text-gray-900'}>
            {recentConflicts === 0 ? '✓ Keine neuen' : `${recentConflicts} neue`}
          </span>
        </div>
      </div>

      {/* All empty state */}
      {!hasConflicts && (
        <div className="py-4 text-center">
          <span className="text-green-600 text-2xl block mb-2">✓</span>
          <p className="text-green-700 text-sm">Keine aktiven Konflikte</p>
        </div>
      )}

      <Link
        href="/incidents"
        className="block text-center mt-4 pt-4 border-t border-gray-100 text-sm text-aoz-primary hover:underline"
      >
        Alle Vorfälle →
      </Link>
    </div>
  )
}
