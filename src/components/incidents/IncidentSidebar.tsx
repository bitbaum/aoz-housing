import Link from 'next/link'
import { resolveIncident, updateMediationTime } from '@/lib/actions'
import { FormValidationUX } from '@/components/forms'
import { SubmitButton } from '@/components/ui'
import { formatDate } from '@/lib/utils'
import { INCIDENT_SIDEBAR_LABELS } from '@/lib/constants'
import { residentInitials, residentName, type NamedResident } from '@/lib/utils/resident-name'

interface Props {
  incident: {
    id: string
    category: string
    createdAt: Date
    date: Date
    resolvedAt: Date | null
    housingUnitId: string
    housingUnit: { code: string; address: string }
    reportedBy: NamedResident | null
    reportedById: string | null
    subject: NamedResident | null
    subjectId: string | null
    involvedResidents: Array<{
      id: string
      residentId: string
      role: string
      resident: NamedResident
    }>
    followUpCount: number
    mediationMinutes: number | null
  }
}

export function IncidentSidebar({ incident }: Props) {
  return (
    <div className="space-y-6">
      {/* Location */}
      <div className="card">
        <h2 className="text-lg font-semibold text-ui-text mb-4">
          {INCIDENT_SIDEBAR_LABELS.location}
        </h2>
        <Link
          href={`/housing/${incident.housingUnitId}`}
          className="flex items-center gap-3 p-3 bg-ui-subtle rounded-lg hover:bg-ui-subtle"
        >
          <span className="text-xl">🏠</span>
          <div>
            <p className="font-medium text-ui-text">{incident.housingUnit.code}</p>
            <p className="text-sm text-ui-muted">{incident.housingUnit.address}</p>
          </div>
        </Link>
      </div>

      {/* People Involved */}
      <div className="card">
        <h2 className="text-lg font-semibold text-ui-text mb-4">
          {INCIDENT_SIDEBAR_LABELS.involved}
        </h2>
        <div className="space-y-3">
          {incident.reportedBy && (
            <Link
              href={`/residents/${incident.reportedById}`}
              className="flex items-center gap-3 p-3 bg-ui-subtle rounded-lg hover:bg-ui-subtle"
            >
              <span className="text-lg">📢</span>
              <div>
                <p className="text-sm text-ui-muted">{INCIDENT_SIDEBAR_LABELS.reportedBy}</p>
                <p className="font-medium text-ui-text">{residentName(incident.reportedBy)}</p>
              </div>
            </Link>
          )}

          {incident.subject && (
            <Link
              href={`/residents/${incident.subjectId}`}
              className="flex items-center gap-3 p-3 bg-status-warning/10 rounded-lg hover:bg-status-warning/15"
            >
              <span className="text-lg">👤</span>
              <div>
                <p className="text-sm text-ui-muted">{INCIDENT_SIDEBAR_LABELS.subject}</p>
                <p className="font-medium text-status-warning-text">
                  {residentName(incident.subject)}
                </p>
              </div>
            </Link>
          )}

          {incident.involvedResidents.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-ui-muted">{INCIDENT_SIDEBAR_LABELS.otherInvolved}</p>
              {incident.involvedResidents.map((inv) => (
                <Link
                  key={inv.id}
                  href={`/residents/${inv.residentId}`}
                  className="flex items-center gap-3 p-2 bg-ui-subtle rounded hover:bg-ui-subtle"
                >
                  <span className="font-medium text-ui-text">{residentName(inv.resident)}</span>
                  <span className="text-xs text-ui-muted">({inv.role})</span>
                </Link>
              ))}
            </div>
          )}

          {!incident.reportedBy && !incident.subject && incident.involvedResidents.length === 0 && (
            <p className="text-ui-muted text-sm">{INCIDENT_SIDEBAR_LABELS.noResidentsAssigned}</p>
          )}
        </div>
      </div>

      {/* Actions — the free-text quick-close exists ONLY for maintenance.
          A conflict must close through the resolution ladder, which records
          the stage and an agreement that can be checked later; a free-text
          "gelöst" note beside the ladder was a second, cheaper door out of
          the same conflict, and notes can't be followed up on. */}
      {!incident.resolvedAt && incident.category === 'MAINTENANCE' && (
        <div className="card">
          <h2 className="text-lg font-semibold text-ui-text mb-4">
            {INCIDENT_SIDEBAR_LABELS.actions}
          </h2>
          <form id="incident-resolve-form" action={resolveIncident} className="space-y-4">
            <input type="hidden" name="incidentId" value={incident.id} />
            <div
              id="incident-resolve-validation-summary"
              className="hidden alert-error"
              role="alert"
            />
            <FormValidationUX
              formId="incident-resolve-form"
              summaryId="incident-resolve-validation-summary"
            />
            <div>
              <label className="label">{INCIDENT_SIDEBAR_LABELS.resolution}</label>
              <textarea
                name="resolution"
                rows={3}
                placeholder={INCIDENT_SIDEBAR_LABELS.resolutionPlaceholder}
                className="input"
              />
            </div>
            <SubmitButton className="btn-primary w-full min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-wait">
              {INCIDENT_SIDEBAR_LABELS.markResolved}
            </SubmitButton>
          </form>
        </div>
      )}

      {/* Mediation Time */}
      <div className="card">
        <h2 className="text-lg font-semibold text-ui-text mb-3">
          {INCIDENT_SIDEBAR_LABELS.mediationTimeEdit}
        </h2>
        <form action={updateMediationTime} className="flex items-center gap-2">
          <input type="hidden" name="incidentId" value={incident.id} />
          <input
            type="number"
            inputMode="numeric"
            name="mediationMinutes"
            min="0"
            max="9999"
            step="5"
            defaultValue={incident.mediationMinutes ?? 0}
            placeholder={INCIDENT_SIDEBAR_LABELS.mediationTimePlaceholder}
            className="input flex-1"
            aria-label={INCIDENT_SIDEBAR_LABELS.mediationTimeEdit}
          />
          <span className="text-sm text-ui-muted whitespace-nowrap">
            {INCIDENT_SIDEBAR_LABELS.mediationTimeUnit}
          </span>
          <SubmitButton className="btn-outline min-h-[44px] px-3 text-sm whitespace-nowrap disabled:opacity-60 disabled:cursor-wait">
            {INCIDENT_SIDEBAR_LABELS.mediationTimeSave}
          </SubmitButton>
        </form>
      </div>

      {/* Meta Info */}
      <div className="card">
        <h2 className="text-lg font-semibold text-ui-text mb-4">
          {INCIDENT_SIDEBAR_LABELS.details}
        </h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-ui-muted">{INCIDENT_SIDEBAR_LABELS.created}</dt>
            <dd className="text-ui-text">{formatDate(incident.createdAt)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ui-muted">{INCIDENT_SIDEBAR_LABELS.incidentDate}</dt>
            <dd className="text-ui-text">{formatDate(incident.date)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ui-muted">{INCIDENT_SIDEBAR_LABELS.followUps}</dt>
            <dd className="text-ui-text">{incident.followUpCount}</dd>
          </div>
          {incident.mediationMinutes !== null && incident.mediationMinutes > 0 && (
            <div className="flex justify-between">
              <dt className="text-ui-muted">{INCIDENT_SIDEBAR_LABELS.mediationTime}</dt>
              <dd className="text-ui-text font-medium">
                {incident.mediationMinutes >= 60
                  ? `${Math.floor(incident.mediationMinutes / 60)}h ${incident.mediationMinutes % 60 > 0 ? `${incident.mediationMinutes % 60}min` : ''}`
                  : `${incident.mediationMinutes} min`}
              </dd>
            </div>
          )}
          {incident.resolvedAt && (
            <div className="flex justify-between">
              <dt className="text-ui-muted">{INCIDENT_SIDEBAR_LABELS.resolvedAt}</dt>
              <dd className="text-ui-text">{formatDate(incident.resolvedAt)}</dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  )
}
