import Link from 'next/link'
import { addFollowUp } from '@/lib/actions'
import { FormValidationUX } from '@/components/forms'
import { FOLLOW_UP_PRIORITY_LABELS } from '@/lib/constants'

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
            <h3 className="font-medium text-gray-900">Schnellvorlagen</h3>
            <p className="text-xs text-gray-500">Typische Follow-up-Einträge mit einem Klick vorbefüllen</p>
          </div>
          {activeTemplate && (
            <Link href={`/incidents/${incidentId}`} className="text-sm text-gray-500 hover:text-gray-700">
              Vorlage zurücksetzen
            </Link>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href={templateHref(incidentId, {
              tpl: 'deescalation',
              action: 'Deeskalationsgespräch durchgeführt',
              notes: 'Gespräch mit Beteiligten geführt, Auslöser und Regeln geklärt.',
              outcome: 'Situation aktuell stabil. Weitere Beobachtung vereinbart.',
              followUpPriority: 'MEDIUM',
            })}
            className={`btn-outline min-h-[44px] inline-flex items-center ${activeTemplate === 'deescalation' ? 'bg-blue-100 border-blue-300 text-blue-700' : ''}`}
          >
            🗣️ Deeskalation
          </Link>
          <Link
            href={templateHref(incidentId, {
              tpl: 'safety-check',
              action: 'Sicherheitsprüfung durchgeführt',
              notes: 'Risiken vor Ort geprüft und Sofortmassnahmen dokumentiert.',
              outcome: 'Akute Gefahr aktuell nicht festgestellt. Follow-up eingeplant.',
              followUpPriority: 'HIGH',
            })}
            className={`btn-outline min-h-[44px] inline-flex items-center ${activeTemplate === 'safety-check' ? 'bg-blue-100 border-blue-300 text-blue-700' : ''}`}
          >
            🚨 Sicherheitscheck
          </Link>
          <Link
            href={templateHref(incidentId, {
              tpl: 'house-rules',
              action: 'Hausregel-Hinweis und Dokumentation',
              notes: 'Hausregeln und Konsequenzen erneut erklärt, Verständnis bestätigt.',
              outcome: 'Mündliche Vereinbarung getroffen, nächster Kontrolltermin definiert.',
              followUpPriority: 'LOW',
            })}
            className={`btn-outline min-h-[44px] inline-flex items-center ${activeTemplate === 'house-rules' ? 'bg-blue-100 border-blue-300 text-blue-700' : ''}`}
          >
            📋 Hausregeln
          </Link>
        </div>
      </div>

      <h3 className="font-medium text-gray-900 mb-2">
        Neues Follow-up hinzufügen
      </h3>
      <form id="incident-followup-form" action={addFollowUp} className="space-y-4">
        <input type="hidden" name="incidentId" value={incidentId} />
        <div id="incident-followup-validation-summary" className="hidden p-3 rounded border border-red-300 bg-red-50 text-red-800 text-sm" role="alert" />
        <FormValidationUX formId="incident-followup-form" summaryId="incident-followup-validation-summary" />

        <div>
          <label className="label">Aktion/Massnahme *</label>
          <input
            type="text"
            name="action"
            required
            defaultValue={defaultAction}
            placeholder="z.B. Gespräch mit Bewohner geführt"
            className="input"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Notizen</label>
            <textarea
              name="notes"
              rows={2}
              defaultValue={defaultNotes}
              placeholder="Details zur Massnahme..."
              className="input"
            />
          </div>
          <div>
            <label className="label">Ergebnis</label>
            <textarea
              name="outcome"
              rows={2}
              defaultValue={defaultOutcome}
              placeholder="Was kam dabei heraus?"
              className="input"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="label">Mitarbeiter</label>
            <input
              type="text"
              name="staffName"
              defaultValue={defaultStaffName}
              placeholder="Name"
              className="input"
            />
          </div>
          <div>
            <label className="label">Nächste Follow-up</label>
            <input
              type="date"
              name="scheduledNextDate"
              className="input"
            />
          </div>
          <div>
            <label className="label">Priorität</label>
            <select name="followUpPriority" className="input" defaultValue={defaultPriority}>
              <option value="">Keine</option>
              {Object.entries(FOLLOW_UP_PRIORITY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label.split(' (')[0]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button type="submit" className="btn-primary w-full sm:w-auto min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aoz-primary focus-visible:ring-offset-2">
          Follow-up hinzufügen
        </button>
      </form>
    </div>
  )
}
