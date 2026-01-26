import { prisma } from '@/lib/db'
import Link from 'next/link'
import { TrendingDown, TrendingUp, Users, CheckCircle2, AlertTriangle, BarChart3 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ROIDashboard() {
  const now = new Date()
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)

  // Get all placements and incidents - REAL DATA ONLY
  const [allPlacements, allIncidents, allUnits] = await Promise.all([
    prisma.placement.findMany({
      where: {
        startDate: { gte: sixMonthsAgo }
      },
      include: {
        housingUnit: true,
        resident: true
      }
    }),
    prisma.incident.findMany({
      where: {
        category: 'INTERPERSONAL',
        date: { gte: sixMonthsAgo }
      },
      include: {
        housingUnit: true
      }
    }),
    prisma.housingUnit.findMany({
      include: {
        placements: {
          where: { status: 'ACTIVE' }
        }
      }
    })
  ])

  // Calculate metrics from REAL DATA
  const totalPlacements = allPlacements.length
  const totalIncidents = allIncidents.length

  // Placements with compatibility scores
  const placementsWithScores = allPlacements.filter(p => p.compatibilityScore !== null)
  const avgCompatibilityScore = placementsWithScores.length > 0
    ? Math.round(placementsWithScores.reduce((sum, p) => sum + (p.compatibilityScore || 0), 0) / placementsWithScores.length)
    : null

  // Conflict rate per placement
  const conflictRate = totalPlacements > 0
    ? ((totalIncidents / totalPlacements) * 100).toFixed(1)
    : '0'

  // Success rate: placements still active OR ended without conflict
  const successfulPlacements = allPlacements.filter(p => {
    if (p.status === 'ACTIVE') return true
    return p.endReason !== 'CONFLICT'
  })
  const successRate = totalPlacements > 0
    ? Math.round((successfulPlacements.length / totalPlacements) * 100)
    : 0

  // Placements ended due to conflict
  const conflictEndedPlacements = allPlacements.filter(p => p.endReason === 'CONFLICT')

  // Unit performance breakdown
  const unitPerformance = allUnits.map(unit => {
    const unitPlacements = allPlacements.filter(p => p.housingUnitId === unit.id)
    const unitIncidents = allIncidents.filter(i => i.housingUnitId === unit.id)
    const unitScores = unitPlacements.filter(p => p.compatibilityScore !== null)
    const avgScore = unitScores.length > 0
      ? Math.round(unitScores.reduce((sum, p) => sum + (p.compatibilityScore || 0), 0) / unitScores.length)
      : null

    return {
      id: unit.id,
      code: unit.code,
      placements: unitPlacements.length,
      incidents: unitIncidents.length,
      avgScore,
      incidentRate: unitPlacements.length > 0 ? (unitIncidents.length / unitPlacements.length) : 0
    }
  }).filter(u => u.placements > 0)

  // Sort by incident rate (highest first)
  const problemUnits = [...unitPerformance]
    .filter(u => u.incidents > 0)
    .sort((a, b) => b.incidentRate - a.incidentRate)

  const stableUnits = [...unitPerformance]
    .filter(u => u.incidents === 0 && u.placements >= 1)
    .sort((a, b) => (b.avgScore || 0) - (a.avgScore || 0))

  // Score distribution
  const scoreRanges = {
    excellent: placementsWithScores.filter(p => (p.compatibilityScore || 0) >= 80).length,
    good: placementsWithScores.filter(p => (p.compatibilityScore || 0) >= 60 && (p.compatibilityScore || 0) < 80).length,
    medium: placementsWithScores.filter(p => (p.compatibilityScore || 0) >= 40 && (p.compatibilityScore || 0) < 60).length,
    low: placementsWithScores.filter(p => (p.compatibilityScore || 0) < 40).length,
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-gray-900">System-Metriken</h1>
          <Link
            href="/analytics"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Zurück zu Analytics
          </Link>
        </div>
        <p className="text-gray-600">
          Alle Zahlen direkt aus der Datenbank berechnet
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <div className="inline-flex items-center px-3 py-1 bg-blue-100 border border-blue-300 rounded-full text-sm font-medium text-blue-800">
            <BarChart3 className="w-4 h-4 mr-1" />
            Letzte 6 Monate
          </div>
        </div>
      </div>

      {/* Key Metrics Grid - ALL FROM REAL DATA */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Placements */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {totalPlacements}
          </h3>
          <p className="text-sm text-gray-600">Platzierungen total</p>
          <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
            Letzte 6 Monate
          </div>
        </div>

        {/* Incidents */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {totalIncidents}
          </h3>
          <p className="text-sm text-gray-600">Interpersonelle Konflikte</p>
          <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
            {conflictRate}% Konfliktrate
          </div>
        </div>

        {/* Success Rate */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {successRate}%
          </h3>
          <p className="text-sm text-gray-600">Erfolgsquote</p>
          <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
            {successfulPlacements.length} von {totalPlacements} erfolgreich
          </div>
        </div>

        {/* Average Compatibility */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {avgCompatibilityScore !== null ? `${avgCompatibilityScore}%` : 'N/A'}
          </h3>
          <p className="text-sm text-gray-600">Ø Kompatibilität</p>
          <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
            {placementsWithScores.length} mit Score
          </div>
        </div>
      </div>

      {/* Score Distribution */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Kompatibilitäts-Verteilung</h2>
        <p className="text-sm text-gray-600 mb-4">Verteilung der Kompatibilitätsscores bei allen {placementsWithScores.length} bewerteten Platzierungen</p>

        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-3xl font-bold text-green-600">{scoreRanges.excellent}</p>
            <p className="text-sm text-green-800 font-medium">Sehr gut</p>
            <p className="text-xs text-gray-500">≥80%</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-3xl font-bold text-blue-600">{scoreRanges.good}</p>
            <p className="text-sm text-blue-800 font-medium">Gut</p>
            <p className="text-xs text-gray-500">60-79%</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-3xl font-bold text-yellow-600">{scoreRanges.medium}</p>
            <p className="text-sm text-yellow-800 font-medium">Mittel</p>
            <p className="text-xs text-gray-500">40-59%</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-3xl font-bold text-red-600">{scoreRanges.low}</p>
            <p className="text-sm text-red-800 font-medium">Niedrig</p>
            <p className="text-xs text-gray-500">&lt;40%</p>
          </div>
        </div>
      </div>

      {/* Unit Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Problem Units */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-semibold text-gray-900">Einheiten mit Konflikten</h2>
          </div>

          {problemUnits.length === 0 ? (
            <p className="text-sm text-gray-500 italic">Keine Konflikte in letzten 6 Monaten</p>
          ) : (
            <div className="space-y-3">
              {problemUnits.slice(0, 5).map(unit => (
                <div key={unit.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{unit.code}</p>
                    <p className="text-xs text-gray-600">
                      {unit.placements} Platzierungen, Ø {unit.avgScore ?? 'N/A'}% Kompatibilität
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-red-600">{unit.incidents}</p>
                    <p className="text-xs text-red-600">Konflikte</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stable Units */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">Stabile Einheiten</h2>
          </div>

          {stableUnits.length === 0 ? (
            <p className="text-sm text-gray-500 italic">Keine Einheiten ohne Konflikte</p>
          ) : (
            <div className="space-y-3">
              {stableUnits.slice(0, 5).map(unit => (
                <div key={unit.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{unit.code}</p>
                    <p className="text-xs text-gray-600">
                      {unit.placements} Platzierungen
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">{unit.avgScore ?? 'N/A'}%</p>
                    <p className="text-xs text-green-600">Ø Kompatibilität</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Conflict Correlation */}
      {conflictEndedPlacements.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Konflikt-Analyse</h2>
          <p className="text-sm text-gray-600 mb-4">
            {conflictEndedPlacements.length} Platzierungen wurden aufgrund von Konflikten beendet
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {conflictEndedPlacements.map(p => (
              <div key={p.id} className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm">
                <p className="font-medium text-gray-900">
                  {p.resident.code}
                </p>
                <p className="text-gray-600">
                  {p.housingUnit.code} • Score: {p.compatibilityScore ?? 'N/A'}%
                </p>
                {p.placementNotes && (
                  <p className="text-xs text-gray-500 mt-1">{p.placementNotes}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Summary */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Daten-Zusammenfassung</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Platzierungen</p>
            <p className="font-bold text-gray-900">{totalPlacements}</p>
          </div>
          <div>
            <p className="text-gray-600">Mit Score</p>
            <p className="font-bold text-gray-900">{placementsWithScores.length}</p>
          </div>
          <div>
            <p className="text-gray-600">Konflikte</p>
            <p className="font-bold text-gray-900">{totalIncidents}</p>
          </div>
          <div>
            <p className="text-gray-600">Einheiten</p>
            <p className="font-bold text-gray-900">{allUnits.length}</p>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-4">
          Alle Metriken werden direkt aus der Datenbank berechnet. Keine Schätzungen oder Annahmen.
        </p>
      </div>
    </div>
  )
}
