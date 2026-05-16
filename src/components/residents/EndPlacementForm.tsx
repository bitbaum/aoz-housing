'use client'

import { endPlacement } from '@/lib/actions'
import { END_REASON_LABELS, END_REASON_DESCRIPTIONS, COMPATIBILITY_GAP_LABELS, PLACEMENT_ACTIONS_LABELS, UI_LABELS } from '@/lib/constants'
import { DISPLAY_LIMITS } from '@/lib/config/thresholds'

export interface RecentIncident {
  id: string
  date: Date
  type: string
  description: string
}

interface EndPlacementFormProps {
  placementId: string
  residentId: string
  recentIncidents: RecentIncident[]
  initialCompatibilityScore?: number | null
  selectedEndReason: string
  onReasonChange: (reason: string) => void
  onClose: () => void
}

export function EndPlacementForm({
  placementId,
  residentId,
  recentIncidents,
  initialCompatibilityScore,
  selectedEndReason,
  onReasonChange,
  onClose,
}: EndPlacementFormProps) {
  const endSummary = selectedEndReason
    ? PLACEMENT_ACTIONS_LABELS.endSummaryWithReason(END_REASON_LABELS[selectedEndReason] || selectedEndReason)
    : PLACEMENT_ACTIONS_LABELS.endSummaryEmpty

  return (
    <form
      action={endPlacement}
      className="mt-4 p-4 bg-status-error/8 rounded-lg space-y-4 border border-status-error/25"
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-red-900">{PLACEMENT_ACTIONS_LABELS.endTitle}</h4>
        <button
          type="button"
          className="text-status-error hover:text-red-800 text-sm"
          onClick={onClose}
        >
          {PLACEMENT_ACTIONS_LABELS.closeBtn}
        </button>
      </div>
      <input type="hidden" name="placementId" value={placementId} />
      <input type="hidden" name="residentId" value={residentId} />

      <div className="p-3 bg-status-error/15 rounded text-sm text-red-800">
        <strong>{PLACEMENT_ACTIONS_LABELS.endWarningTitle}</strong> {PLACEMENT_ACTIONS_LABELS.endWarning}
      </div>

      <div>
        <label className="label">{PLACEMENT_ACTIONS_LABELS.endReasonLabel}</label>
        <div className="space-y-2">
          {Object.entries(END_REASON_LABELS).map(([key, label]) => (
            <label key={key} className="flex items-start gap-3 p-2 rounded hover:bg-status-error/10 cursor-pointer">
              <input
                type="radio"
                name="endReason"
                value={key}
                required
                className="mt-1"
                onChange={() => onReasonChange(key)}
              />
              <div>
                <span className="font-medium text-gray-900">{label}</span>
                <p className="text-xs text-gray-500">
                  {END_REASON_DESCRIPTIONS[key]}
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {selectedEndReason === 'CONFLICT' && (
        <div className="p-4 bg-status-warning/10 rounded-lg border border-status-warning/25 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-status-warning text-lg">📊</span>
            <h5 className="font-medium text-amber-900">{PLACEMENT_ACTIONS_LABELS.conflictAnalysisTitle}</h5>
          </div>
          <p className="text-sm text-amber-700 mb-3">
            {PLACEMENT_ACTIONS_LABELS.conflictAnalysisDesc}
          </p>

          <div>
            <label className="label">{PLACEMENT_ACTIONS_LABELS.conflictCauseLabel}</label>
            <select name="conflictGap" required className="input">
              <option value="">{UI_LABELS.selectPlaceholder}</option>
              {Object.entries(COMPATIBILITY_GAP_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">{PLACEMENT_ACTIONS_LABELS.conflictPredictableLabel}</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="wasPredictable"
                  value="true"
                  className="accent-status-warning"
                />
                <span className="text-sm text-gray-700">
                  {PLACEMENT_ACTIONS_LABELS.conflictPredictableYes}
                  {initialCompatibilityScore !== null && initialCompatibilityScore !== undefined && initialCompatibilityScore < 60 && (
                    <span className="text-status-warning ml-1">{PLACEMENT_ACTIONS_LABELS.conflictScoreHint(Math.round(initialCompatibilityScore))}</span>
                  )}
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="wasPredictable"
                  value="false"
                  className="accent-status-warning"
                />
                <span className="text-sm text-gray-700">{PLACEMENT_ACTIONS_LABELS.conflictNoPredictable}</span>
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {PLACEMENT_ACTIONS_LABELS.conflictAlgorithmLabel}
            </p>
          </div>

          {recentIncidents.length > 0 && (
            <div>
              <label className="label">{PLACEMENT_ACTIONS_LABELS.linkedIncidentLabel}</label>
              <select name="relatedIncidentId" className="input">
                <option value="">{PLACEMENT_ACTIONS_LABELS.noLinkedIncident}</option>
                {recentIncidents.map((incident) => (
                  <option key={incident.id} value={incident.id}>
                    {new Date(incident.date).toLocaleDateString('de-CH')} - {incident.type}: {incident.description.slice(0, DISPLAY_LIMITS.descriptionPreview)}...
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {PLACEMENT_ACTIONS_LABELS.incidentOptionalHint}
              </p>
            </div>
          )}
        </div>
      )}

      <div>
        <label className="label">{PLACEMENT_ACTIONS_LABELS.endNotesLabel}</label>
        <textarea
          name="notes"
          rows={2}
          placeholder={PLACEMENT_ACTIONS_LABELS.endNotesPlaceholder}
          className="input"
        />
      </div>

      <div className="p-3 bg-white border border-status-error/30 rounded text-sm text-red-900">
        <strong>{PLACEMENT_ACTIONS_LABELS.summaryLabel}</strong> {endSummary}
      </div>

      <button
        type="submit"
        className="bg-status-error text-white px-4 py-2.5 rounded-lg text-sm hover:bg-status-error/90 min-h-[44px]"
      >
        {PLACEMENT_ACTIONS_LABELS.endBtn}
      </button>
    </form>
  )
}
