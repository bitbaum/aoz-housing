import { COMPATIBILITY_GAP_LABELS, getLabel } from '@/lib/constants'
import { ALGORITHM_ACCURACY_LABELS } from '@/lib/constants/labels/dashboard'

interface Props {
  conflictsByGap: Record<string, number>
  conflictPlacementsCount: number
  predictableCount: number
  unpredictableCount: number
  lowScoreCount: number
}

export function ConflictAnalysisSection({
  conflictsByGap,
  conflictPlacementsCount,
  predictableCount,
  unpredictableCount,
  lowScoreCount,
}: Props) {
  const totalPredictability = predictableCount + unpredictableCount

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mt-4 sm:mt-6">
      {/* Conflict Gap Breakdown */}
      <div className="card border-l-4 border-orange-400">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-status-warning-text text-xl" aria-hidden="true">📊</span>
          <h2 className="text-lg font-semibold text-ui-text">
            {ALGORITHM_ACCURACY_LABELS.conflictCausesTitle}
          </h2>
        </div>
        {Object.keys(conflictsByGap).length === 0 ? (
          <div className="text-center py-6">
            <p className="text-ui-muted text-sm">
              {ALGORITHM_ACCURACY_LABELS.conflictCausesEmpty}
            </p>
            <p className="text-xs text-ui-muted mt-1">
              {ALGORITHM_ACCURACY_LABELS.conflictCausesEmptyHint}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(conflictsByGap)
              .sort((a, b) => b[1] - a[1])
              .map(([gap, count]) => (
                <div key={gap} className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-ui-text">
                        {getLabel(COMPATIBILITY_GAP_LABELS, gap)}
                      </span>
                      <span className="text-ui-muted">
                        {count} ({Math.round((count / conflictPlacementsCount) * 100)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-ui-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-status-warning"
                        style={{
                          width: `${(count / conflictPlacementsCount) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Predictability Insights */}
      <div className="card border-l-4 border-blue-400">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-status-info-text text-xl" aria-hidden="true">🔮</span>
          <h2 className="text-lg font-semibold text-ui-text">
            {ALGORITHM_ACCURACY_LABELS.algorithmInsightsTitle}
          </h2>
        </div>
        {conflictPlacementsCount === 0 ? (
          <div className="text-center py-6">
            <p className="text-ui-muted text-sm">
              {ALGORITHM_ACCURACY_LABELS.predictabilityEmpty}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 bg-status-success/10 rounded-lg text-center">
                <p className="text-2xl font-bold text-status-success">
                  {predictableCount}
                </p>
                <p className="text-xs text-status-success-text">{ALGORITHM_ACCURACY_LABELS.predictableLabel}</p>
              </div>
              <div className="p-3 bg-status-error/8 rounded-lg text-center">
                <p className="text-2xl font-bold text-status-error">
                  {unpredictableCount}
                </p>
                <p className="text-xs text-status-error-text">{ALGORITHM_ACCURACY_LABELS.unpredictableLabel}</p>
              </div>
            </div>

            {totalPredictability > 0 && (
              <div className="p-3 bg-ui-subtle rounded-lg">
                <p className="text-sm text-ui-muted">
                  <strong>
                    {Math.round((predictableCount / totalPredictability) * 100)}%
                  </strong>{' '}
                  {ALGORITHM_ACCURACY_LABELS.predictabilityRateSuffix}
                </p>
              </div>
            )}

            {lowScoreCount > 0 && (
              <div className="p-3 bg-status-warning/10 rounded-lg border border-status-warning/25">
                <p className="text-sm text-status-warning-text">
                  <strong>{lowScoreCount}</strong> {ALGORITHM_ACCURACY_LABELS.lowScoreWarningPrefix}
                </p>
                <p className="text-xs text-status-warning-text mt-1">
                  {ALGORITHM_ACCURACY_LABELS.lowScoreHint}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
