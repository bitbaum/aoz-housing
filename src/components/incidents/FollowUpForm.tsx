import Link from 'next/link'
import { addFollowUp } from '@/lib/actions'
import { FormValidationUX } from '@/components/forms'
import { FOLLOW_UP_PRIORITY_LABELS, FOLLOW_UP_FORM_LABELS } from '@/lib/constants'

interface Props {
  incidentId: string
  activeTemplate?: string
  defaultAction?: string
  defaultNotes?: string
  defaultOutcome?: string
  defaultPriority?: string
  defaultStaffName?: string
}

function templateHref(
  incidentId: string,
  preset: {
    tpl: string
    action: string
    notes: string
    outcome: string
    followUpPriority: 'LOW' | 'MEDIUM' | 'HIGH'
  },
) {
  const q = new URLSearchParams()
  q.set('tpl', preset.tpl)
  q.set('action', preset.action)
  q.set('notes', preset.notes)
  q.set('outcome', preset.outcome)
  q.set('followUpPriority', preset.followUpPriority)
  return `/incidents/${incidentId}?${q.toString()}`
}

export function FollowUpForm({
  incidentId,
  activeTemplate,
  defaultAction = '',
  defaultNotes = '',
  defaultOutcome = '',
  defaultPriority = '',
  defaultStaffName = '',
}: Props) {
  return (
    <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
      <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="font-medium text-gray-900">{FOLLOW_UP_FORM_LABELS.quickTemplates}</h3>
            <p className="text-xs text-gray-500">{FOLLOW_UP_FORM_LABELS.quickTemplatesHint}</p>
          </div>
          {activeTemplate && (
            <Link href={`/incidents/${incidentId}`} className="inline-flex items-center min-h-[44px] px-1 text-sm text-gray-500 hover:text-gray-700">
              {FOLLOW_UP_FORM_LABELS.resetTemplate}
            </Link>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href={templateHref(incidentId, {
              tpl: 'deescalation',
              action: FOLLOW_UP_FORM_LABELS.templates.deescalation.title,
              notes: FOLLOW_UP_FORM_LABELS.templates.deescalation.action,
              outcome: FOLLOW_UP_FORM_LABELS.templates.deescalation.outcome,
              followUpPriority: 'MEDIUM',
            })}
            className={`btn-outline min-h-[44px] inline-flex items-center ${activeTemplate === 'deescalation' ? 'bg-aoz-primary/10 border-aoz-primary/40 text-aoz-primary' : ''}`}
          >
            🗣️ {FOLLOW_UP_FORM_LABELS.templates.deescalation.label}
          </Link>
          <Link
            href={templateHref(incidentId, {
              tpl: 'safety-check',
              action: FOLLOW_UP_FORM_LABELS.templates.safety.title,
              notes: FOLLOW_UP_FORM_LABELS.templates.safety.action,
              outcome: FOLLOW_UP_FORM_LABELS.templates.safety.outcome,
              followUpPriority: 'HIGH',
            })}
            className={`btn-outline min-h-[44px] inline-flex items-center ${activeTemplate === 'safety-check' ? 'bg-aoz-primary/10 border-aoz-primary/40 text-aoz-primary' : ''}`}
          >
            🚨 {FOLLOW_UP_FORM_LABELS.templates.safety.label}
          </Link>
          <Link
            href={templateHref(incidentId, {
              tpl: 'house-rules',
              action: FOLLOW_UP_FORM_LABELS.templates.houseRules.title,
              notes: FOLLOW_UP_FORM_LABELS.templates.houseRules.action,
              outcome: FOLLOW_UP_FORM_LABELS.templates.houseRules.outcome,
              followUpPriority: 'LOW',
            })}
            className={`btn-outline min-h-[44px] inline-flex items-center ${activeTemplate === 'house-rules' ? 'bg-aoz-primary/10 border-aoz-primary/40 text-aoz-primary' : ''}`}
          >
            📋 {FOLLOW_UP_FORM_LABELS.templates.houseRules.label}
          </Link>
        </div>
      </div>

      <h3 className="font-medium text-gray-900 mb-2">
        {FOLLOW_UP_FORM_LABELS.title}
      </h3>
      <form id="incident-followup-form" action={addFollowUp} className="space-y-4">
        <input type="hidden" name="incidentId" value={incidentId} />
        <div id="incident-followup-validation-summary" className="hidden p-3 rounded border border-status-error/30 bg-status-error/8 text-status-error-text text-sm" role="alert" />
        <FormValidationUX formId="incident-followup-form" summaryId="incident-followup-validation-summary" />

        <div>
          <label className="label">{FOLLOW_UP_FORM_LABELS.actionLabel}</label>
          <input
            type="text"
            name="action"
            required
            defaultValue={defaultAction}
            placeholder={FOLLOW_UP_FORM_LABELS.actionPlaceholder}
            className="input"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">{FOLLOW_UP_FORM_LABELS.notesLabel}</label>
            <textarea
              name="notes"
              rows={2}
              defaultValue={defaultNotes}
              placeholder={FOLLOW_UP_FORM_LABELS.notesPlaceholder}
              className="input"
            />
          </div>
          <div>
            <label className="label">{FOLLOW_UP_FORM_LABELS.outcomeLabel}</label>
            <textarea
              name="outcome"
              rows={2}
              defaultValue={defaultOutcome}
              placeholder={FOLLOW_UP_FORM_LABELS.outcomePlaceholder}
              className="input"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="label">{FOLLOW_UP_FORM_LABELS.staffLabel}</label>
            <input
              type="text"
              name="staffName"
              defaultValue={defaultStaffName}
              placeholder={FOLLOW_UP_FORM_LABELS.staffNamePlaceholder}
              className="input"
            />
          </div>
          <div>
            <label className="label">{FOLLOW_UP_FORM_LABELS.nextFollowUpLabel}</label>
            <input
              type="date"
              name="scheduledNextDate"
              className="input"
            />
          </div>
          <div>
            <label className="label">{FOLLOW_UP_FORM_LABELS.priorityLabel}</label>
            <select name="followUpPriority" className="input" defaultValue={defaultPriority}>
              <option value="">{FOLLOW_UP_FORM_LABELS.priorityNone}</option>
              {Object.entries(FOLLOW_UP_PRIORITY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label.split(' (')[0]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button type="submit" className="btn-primary w-full sm:w-auto min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aoz-primary focus-visible:ring-offset-2">
          {FOLLOW_UP_FORM_LABELS.submit}
        </button>
      </form>
    </div>
  )
}
