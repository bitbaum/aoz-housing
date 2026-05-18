/**
 * Algorithm Accuracy Section — shows how well the matching algorithm predicts outcomes
 *
 * Displays: tiered accuracy, satisfaction correlation, prediction stats
 */

import type { AlgorithmAccuracyReport } from '@/lib/analytics/algorithm-accuracy'
import { SATISFACTION_HISTORY_LABELS, ALGORITHM_ACCURACY_LABELS } from '@/lib/constants/labels'

interface Props {
  report: AlgorithmAccuracyReport
}

export function AlgorithmAccuracySection({ report }: Props) {
  if (report.totalWithScores === 0) {
    return (
      <div className="card">
        <h2 className="text-lg font-semibold text-ui-text mb-2">{ALGORITHM_ACCURACY_LABELS.sectionTitle}</h2>
        <p className="text-ui-muted text-center py-8">
          {ALGORITHM_ACCURACY_LABELS.empty}
        </p>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-ui-text">{ALGORITHM_ACCURACY_LABELS.sectionTitle}</h2>
        <p className="text-sm text-ui-muted">
          {ALGORITHM_ACCURACY_LABELS.subtitle(report.totalWithScores)}
        </p>
      </div>

      {/* Score comparison headline */}
      {report.avgScoreConflictEnds !== null && report.avgScoreSuccessfulEnds !== null && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="rounded-lg bg-status-error/8 border border-status-error/20 p-4 text-center">
            <p className="text-sm text-status-error mb-1">{ALGORITHM_ACCURACY_LABELS.avgScoreConflict}</p>
            <p className="text-3xl font-bold text-status-error-text">{report.avgScoreConflictEnds}</p>
          </div>
          <div className="rounded-lg bg-status-success/10 border border-status-success/25 p-4 text-center">
            <p className="text-sm text-status-success mb-1">{ALGORITHM_ACCURACY_LABELS.avgScoreSuccess}</p>
            <p className="text-3xl font-bold text-status-success-text">{report.avgScoreSuccessfulEnds}</p>
          </div>
        </div>
      )}

      {/* Tiered accuracy table */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-ui-muted uppercase tracking-wide mb-3">
          {ALGORITHM_ACCURACY_LABELS.resultsByTierTitle}
        </h3>

        {/* Mobile cards */}
        <div className="md:hidden space-y-3">
          {report.tieredAccuracy.filter(t => t.totalPlacements > 0).map(tier => (
            <div key={tier.tier} className="rounded-lg border border-ui-border p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-ui-text">{tier.label}</span>
                <span className="text-sm text-ui-muted">{tier.totalPlacements} {ALGORITHM_ACCURACY_LABELS.placementsLabel}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div>
                  <p className="text-ui-muted">{ALGORITHM_ACCURACY_LABELS.conflictsLabel}</p>
                  <p className={`font-semibold ${tier.conflictRate > 30 ? 'text-status-error-text' : tier.conflictRate > 15 ? 'text-status-warning-text' : 'text-status-success-text'}`}>
                    {tier.conflictRate}%
                  </p>
                </div>
                <div>
                  <p className="text-ui-muted">{ALGORITHM_ACCURACY_LABELS.satisfactionLabel}</p>
                  <p className="font-semibold text-ui-text">{tier.avgSatisfaction ?? '—'}</p>
                </div>
                <div>
                  <p className="text-ui-muted">{ALGORITHM_ACCURACY_LABELS.avgDurationLabel}</p>
                  <p className="font-semibold text-ui-text">{tier.avgDurationDays ? `${tier.avgDurationDays}d` : '—'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-ui-border">
                <th className="text-left py-2 pr-4 font-medium text-ui-muted">{ALGORITHM_ACCURACY_LABELS.colTier}</th>
                <th className="text-right py-2 px-4 font-medium text-ui-muted">{ALGORITHM_ACCURACY_LABELS.placementsLabel}</th>
                <th className="text-right py-2 px-4 font-medium text-ui-muted">{ALGORITHM_ACCURACY_LABELS.colConflictRate}</th>
                <th className="text-right py-2 px-4 font-medium text-ui-muted">{ALGORITHM_ACCURACY_LABELS.colAvgSatisfaction}</th>
                <th className="text-right py-2 pl-4 font-medium text-ui-muted">{ALGORITHM_ACCURACY_LABELS.colAvgDuration}</th>
              </tr>
            </thead>
            <tbody>
              {report.tieredAccuracy.map(tier => (
                <tr key={tier.tier} className="border-b border-ui-border">
                  <td className="py-2 pr-4 font-medium text-ui-text">{tier.label}</td>
                  <td className="text-right py-2 px-4 text-ui-muted">{tier.totalPlacements}</td>
                  <td className={`text-right py-2 px-4 font-medium ${tier.conflictRate > 30 ? 'text-status-error-text' : tier.conflictRate > 15 ? 'text-status-warning-text' : 'text-status-success-text'}`}>
                    {tier.totalPlacements > 0 ? `${tier.conflictRate}%` : '—'}
                  </td>
                  <td className="text-right py-2 px-4 text-ui-muted">{tier.avgSatisfaction ?? '—'}</td>
                  <td className="text-right py-2 pl-4 text-ui-muted">{tier.avgDurationDays ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Satisfaction Correlation */}
      {report.satisfactionCorrelation.some(s => s.checkInCount > 0) && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-ui-muted uppercase tracking-wide mb-3">
            {ALGORITHM_ACCURACY_LABELS.satisfactionByTierTitle}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {report.satisfactionCorrelation.map(tier => (
              <div key={tier.tier} className="rounded-lg border border-ui-border p-3 text-center">
                <p className="text-xs text-ui-muted mb-1">{tier.label} ({tier.scoreRange})</p>
                <p className="text-xl font-bold text-ui-text">
                  {tier.avgSatisfaction !== null ? `${tier.avgSatisfaction}/5` : '—'}
                </p>
                {tier.avgRoommateRelations !== null && (
                  <p className="text-xs text-ui-muted mt-1">
                    {SATISFACTION_HISTORY_LABELS.roommateRelations} {tier.avgRoommateRelations}/5
                  </p>
                )}
                <p className="text-xs text-ui-muted mt-1">{tier.checkInCount} {ALGORITHM_ACCURACY_LABELS.checkInsLabel}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prediction accuracy */}
      {report.predictionAccuracy.accuracy !== null && (
        <div>
          <h3 className="text-sm font-semibold text-ui-muted uppercase tracking-wide mb-3">
            {ALGORITHM_ACCURACY_LABELS.predictionTitle}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-lg bg-ui-subtle p-3 text-center">
              <p className="text-sm text-ui-muted">{ALGORITHM_ACCURACY_LABELS.predictableConflicts}</p>
              <p className="text-2xl font-bold text-ui-text">{report.predictionAccuracy.predictableConflicts}</p>
            </div>
            <div className="rounded-lg bg-ui-subtle p-3 text-center">
              <p className="text-sm text-ui-muted">{ALGORITHM_ACCURACY_LABELS.unpredictable}</p>
              <p className="text-2xl font-bold text-ui-text">{report.predictionAccuracy.unpredictableConflicts}</p>
            </div>
            <div className="rounded-lg bg-ui-subtle p-3 text-center">
              <p className="text-sm text-ui-muted">{ALGORITHM_ACCURACY_LABELS.notRated}</p>
              <p className="text-2xl font-bold text-ui-text">{report.predictionAccuracy.unmarked}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
