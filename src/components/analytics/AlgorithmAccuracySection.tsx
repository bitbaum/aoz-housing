/**
 * Algorithm Accuracy Section — shows how well the matching algorithm predicts outcomes
 *
 * Displays: tiered accuracy, satisfaction correlation, prediction stats
 */

import type { AlgorithmAccuracyReport } from '@/lib/analytics/algorithm-accuracy'
import { SATISFACTION_HISTORY_LABELS } from '@/lib/constants/labels'

interface Props {
  report: AlgorithmAccuracyReport
}

export function AlgorithmAccuracySection({ report }: Props) {
  if (report.totalWithScores === 0) {
    return (
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Algorithmus-Genauigkeit</h2>
        <p className="text-gray-500 text-center py-8">
          Noch keine beendeten Platzierungen mit Kompatibilitätsbewertung vorhanden.
        </p>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Algorithmus-Genauigkeit</h2>
        <p className="text-sm text-gray-500">
          Vergleich: Kompatibilitätsbewertung vs. tatsächliches Ergebnis ({report.totalWithScores} Platzierungen)
        </p>
      </div>

      {/* Score comparison headline */}
      {report.avgScoreConflictEnds !== null && report.avgScoreSuccessfulEnds !== null && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="rounded-lg bg-red-50 border border-red-100 p-4 text-center">
            <p className="text-sm text-red-600 mb-1">Ø Score bei Konflikt-Ende</p>
            <p className="text-3xl font-bold text-red-700">{report.avgScoreConflictEnds}</p>
          </div>
          <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-4 text-center">
            <p className="text-sm text-emerald-600 mb-1">Ø Score bei erfolgreichem Ende</p>
            <p className="text-3xl font-bold text-emerald-700">{report.avgScoreSuccessfulEnds}</p>
          </div>
        </div>
      )}

      {/* Tiered accuracy table */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
          Ergebnisse nach Kompatibilitätsstufe
        </h3>

        {/* Mobile cards */}
        <div className="md:hidden space-y-3">
          {report.tieredAccuracy.filter(t => t.totalPlacements > 0).map(tier => (
            <div key={tier.tier} className="rounded-lg border border-gray-200 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">{tier.label}</span>
                <span className="text-sm text-gray-500">{tier.totalPlacements} Platzierungen</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div>
                  <p className="text-gray-500">Konflikte</p>
                  <p className={`font-semibold ${tier.conflictRate > 30 ? 'text-red-600' : tier.conflictRate > 15 ? 'text-orange-600' : 'text-emerald-600'}`}>
                    {tier.conflictRate}%
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Zufriedenheit</p>
                  <p className="font-semibold text-gray-900">{tier.avgSatisfaction ?? '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Ø Dauer</p>
                  <p className="font-semibold text-gray-900">{tier.avgDurationDays ? `${tier.avgDurationDays}d` : '—'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 pr-4 font-medium text-gray-500">Stufe</th>
                <th className="text-right py-2 px-4 font-medium text-gray-500">Platzierungen</th>
                <th className="text-right py-2 px-4 font-medium text-gray-500">Konfliktrate</th>
                <th className="text-right py-2 px-4 font-medium text-gray-500">Ø Zufriedenheit</th>
                <th className="text-right py-2 pl-4 font-medium text-gray-500">Ø Dauer (Tage)</th>
              </tr>
            </thead>
            <tbody>
              {report.tieredAccuracy.map(tier => (
                <tr key={tier.tier} className="border-b border-gray-100">
                  <td className="py-2 pr-4 font-medium text-gray-900">{tier.label}</td>
                  <td className="text-right py-2 px-4 text-gray-600">{tier.totalPlacements}</td>
                  <td className={`text-right py-2 px-4 font-medium ${tier.conflictRate > 30 ? 'text-red-600' : tier.conflictRate > 15 ? 'text-orange-600' : 'text-emerald-600'}`}>
                    {tier.totalPlacements > 0 ? `${tier.conflictRate}%` : '—'}
                  </td>
                  <td className="text-right py-2 px-4 text-gray-600">{tier.avgSatisfaction ?? '—'}</td>
                  <td className="text-right py-2 pl-4 text-gray-600">{tier.avgDurationDays ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Satisfaction Correlation */}
      {report.satisfactionCorrelation.some(s => s.checkInCount > 0) && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Zufriedenheit nach Kompatibilitätsstufe
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {report.satisfactionCorrelation.map(tier => (
              <div key={tier.tier} className="rounded-lg border border-gray-200 p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">{tier.label} ({tier.scoreRange})</p>
                <p className="text-xl font-bold text-gray-900">
                  {tier.avgSatisfaction !== null ? `${tier.avgSatisfaction}/5` : '—'}
                </p>
                {tier.avgRoommateRelations !== null && (
                  <p className="text-xs text-gray-500 mt-1">
                    {SATISFACTION_HISTORY_LABELS.roommateRelations} {tier.avgRoommateRelations}/5
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">{tier.checkInCount} Check-ins</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prediction accuracy */}
      {report.predictionAccuracy.accuracy !== null && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Vorhersage-Genauigkeit
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-lg bg-gray-50 p-3 text-center">
              <p className="text-sm text-gray-500">Vorhersagbare Konflikte</p>
              <p className="text-2xl font-bold text-gray-900">{report.predictionAccuracy.predictableConflicts}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3 text-center">
              <p className="text-sm text-gray-500">Unvorhersagbare</p>
              <p className="text-2xl font-bold text-gray-900">{report.predictionAccuracy.unpredictableConflicts}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3 text-center">
              <p className="text-sm text-gray-500">Noch nicht bewertet</p>
              <p className="text-2xl font-bold text-gray-900">{report.predictionAccuracy.unmarked}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
