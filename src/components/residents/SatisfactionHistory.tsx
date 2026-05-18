import { getPlacementCheckIns } from '@/lib/actions'
import { CHECK_IN_TYPE_LABELS, SATISFACTION_HISTORY_LABELS } from '@/lib/constants'
import { formatDate } from '@/lib/utils'

interface SatisfactionHistoryProps {
  placementId: string
}

export async function SatisfactionHistory({ placementId }: SatisfactionHistoryProps) {
  const checkIns = await getPlacementCheckIns(placementId)

  if (checkIns.length === 0) {
    return (
      <div className="card">
        <h2 className="text-lg font-semibold text-ui-text mb-4">
          {SATISFACTION_HISTORY_LABELS.titleEmpty}
        </h2>
        <p className="text-ui-muted text-sm">
          {SATISFACTION_HISTORY_LABELS.empty}
        </p>
      </div>
    )
  }

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-ui-text mb-4">
        {SATISFACTION_HISTORY_LABELS.title(checkIns.length)}
      </h2>
      <div className="space-y-3">
        {checkIns.map((checkIn) => (
          <div
            key={checkIn.id}
            className={`p-3 bg-ui-subtle rounded-lg border-l-4 ${
              checkIn.overallSatisfaction >= 4
                ? 'border-l-status-success'
                : checkIn.overallSatisfaction >= 3
                ? 'border-l-status-warning'
                : 'border-l-status-error'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">
                  {checkIn.overallSatisfaction === 1
                    ? '\u{1F622}'
                    : checkIn.overallSatisfaction === 2
                    ? '\u{1F615}'
                    : checkIn.overallSatisfaction === 3
                    ? '\u{1F610}'
                    : checkIn.overallSatisfaction === 4
                    ? '\u{1F642}'
                    : '\u{1F60A}'}
                </span>
                <div>
                  <span className="font-medium text-ui-text">
                    {CHECK_IN_TYPE_LABELS[checkIn.checkInType] || checkIn.checkInType}
                  </span>
                  {checkIn.weekNumber && (
                    <span className="text-ui-muted text-sm ml-2">
                      {SATISFACTION_HISTORY_LABELS.weekPrefix} {checkIn.weekNumber}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-sm text-ui-muted">
                {formatDate(checkIn.createdAt)}
              </span>
            </div>

            {/* Detailed scores if available */}
            {(checkIn.roommateRelations || checkIn.facilitySatisfaction || checkIn.safetyFeeling) && (
              <div className="flex gap-4 text-xs text-ui-muted mb-2">
                {checkIn.roommateRelations && (
                  <span>{SATISFACTION_HISTORY_LABELS.roommateRelations} {checkIn.roommateRelations}/5</span>
                )}
                {checkIn.facilitySatisfaction && (
                  <span>{SATISFACTION_HISTORY_LABELS.facilitySatisfaction} {checkIn.facilitySatisfaction}/5</span>
                )}
                {checkIn.safetyFeeling && (
                  <span>{SATISFACTION_HISTORY_LABELS.safetyFeeling} {checkIn.safetyFeeling}/5</span>
                )}
              </div>
            )}

            {/* Concerns highlighted */}
            {checkIn.concerns && (
              <div className="text-sm text-status-error-text bg-status-error/8 p-2 rounded mt-2">
                <span className="font-medium">{SATISFACTION_HISTORY_LABELS.concerns}</span> {checkIn.concerns}
              </div>
            )}

            {/* Improvements */}
            {checkIn.improvements && (
              <div className="text-sm text-status-warning-text bg-status-warning/10 p-2 rounded mt-2">
                <span className="font-medium">{SATISFACTION_HISTORY_LABELS.improvements}</span> {checkIn.improvements}
              </div>
            )}

            {/* Positives */}
            {checkIn.positives && (
              <div className="text-sm text-status-success-text bg-status-success/10 p-2 rounded mt-2">
                <span className="font-medium">{SATISFACTION_HISTORY_LABELS.positives}</span> {checkIn.positives}
              </div>
            )}

            {/* Collector info */}
            {checkIn.collectedBy && !checkIn.isAnonymous && (
              <div className="text-xs text-ui-muted mt-2">
                {SATISFACTION_HISTORY_LABELS.collectedBy(checkIn.collectedBy)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
