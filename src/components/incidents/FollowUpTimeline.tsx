import type { IncidentFollowUp } from '@prisma/client'
import { formatRelativeDate, formatDate } from '@/lib/utils'
import { INCIDENT_DETAIL_LABELS } from '@/lib/constants'

interface Props {
  followUps: IncidentFollowUp[]
}

export function FollowUpTimeline({ followUps }: Props) {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Follow-ups ({followUps.length})
        </h2>
      </div>

      {followUps.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          Noch keine Follow-ups dokumentiert
        </p>
      ) : (
        <div className="space-y-4">
          {followUps.map((followUp, index) => (
            <div
              key={followUp.id}
              className={`relative pl-6 pb-4 ${
                index < followUps.length - 1
                  ? 'border-l-2 border-gray-200'
                  : ''
              }`}
            >
              {/* Timeline dot */}
              <div className="absolute -left-2 top-0 w-4 h-4 bg-aoz-primary rounded-full border-2 border-white" />

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <p className="font-medium text-gray-900">
                    {followUp.action}
                  </p>
                  <span className="text-sm text-gray-500">
                    {formatRelativeDate(followUp.createdAt)}
                  </span>
                </div>

                {followUp.notes && (
                  <p className="text-sm text-gray-600 mb-2">
                    {followUp.notes}
                  </p>
                )}

                {followUp.outcome && (
                  <p className="text-sm text-green-700 bg-green-50 px-2 py-1 rounded">
                    Ergebnis: {followUp.outcome}
                  </p>
                )}

                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  {followUp.staffName && (
                    <span>👤 {followUp.staffName}</span>
                  )}
                  {followUp.scheduledNextDate && (
                    <span>📅 {INCIDENT_DETAIL_LABELS.nextScheduledPrefix} {formatDate(followUp.scheduledNextDate)}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
