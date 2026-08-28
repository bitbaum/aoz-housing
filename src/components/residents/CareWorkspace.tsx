'use client'

import {
  APPOINTMENT_STATUS_LABELS,
  CARE_ATTRIBUTE_CATALOG,
  CARE_LABELS,
  CARE_ROLE_LABELS,
  CARE_ROLES,
  type CareRoleId,
} from '@/lib/config/care'
import type { CareAppointment, CareAttributeValue } from '@/lib/actions/care'
import {
  createAppointment,
  saveCareAttributes,
  setAppointmentStatus,
} from '@/lib/actions/care'
import { ChevronDown } from 'lucide-react'
import { formatZurichDateTime } from '@/lib/utils/local-time'

interface CareWorkspaceProps {
  residentId: string
  attributes: CareAttributeValue[]
  appointments: CareAppointment[]
  /**
   * The seats this viewer works — and therefore the only ones rendered.
   *
   * The workspace used to map over CARE_ROLES and pass the writable set down
   * as an edit flag, so every staff member READ all four domains and merely
   * could not type in three of them. A job coach opening any client saw
   * Housing's "Schlüssel: fehlt" and Sozialarbeit's "Nächster Schritt" — notes
   * another discipline wrote about a person, on a page he opened to do a
   * different job. Leitung still receives all four here.
   */
  writableDomains: CareRoleId[]
}

export function CareWorkspace({
  residentId,
  attributes,
  appointments,
  writableDomains,
}: CareWorkspaceProps) {
  // Ordered by CARE_ROLES rather than by the caller's array, so the panels sit
  // in the same order for everyone who sees more than one.
  const domains = CARE_ROLES.filter((domain) => writableDomains.includes(domain))

  if (domains.length === 0) return null

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-ui-text">{CARE_LABELS.workspaceTitle}</h2>
      <p className="text-sm text-ui-muted mt-1 mb-6">{CARE_LABELS.workspaceSubtitle(domains)}</p>

      <div className="space-y-6">
        {domains.map((domain) => (
          <DomainPanel
            key={domain}
            residentId={residentId}
            domain={domain}
            attributes={attributes.filter((item) => item.domain === domain)}
            appointments={appointments.filter((item) => item.domain === domain)}
          />
        ))}
      </div>
    </div>
  )
}

function DomainPanel({
  residentId,
  domain,
  attributes,
  appointments,
}: {
  residentId: string
  domain: CareRoleId
  attributes: CareAttributeValue[]
  appointments: CareAppointment[]
}) {
  const byKey = new Map(attributes.map((item) => [item.key, item.value]))
  const upcoming = appointments.filter((item) => item.status === 'SCHEDULED')
  const past = appointments.filter((item) => item.status !== 'SCHEDULED')
  const hasContent =
    attributes.some((item) => item.value?.trim()) || appointments.length > 0

  return (
    // Four of these stack on the page. When every panel is a wall of empty
    // inputs, the page is ~2500px of form for a person with no care notes yet
    // — so an empty domain collapses to its heading and opens on demand,
    // while a domain with real content stays open.
    <details
      open={hasContent || undefined}
      className="group border border-ui-border rounded-lg"
    >
      <summary className="flex min-h-[44px] cursor-pointer select-none list-none items-center justify-between gap-3 p-4 [&::-webkit-details-marker]:hidden">
        <h3 className="font-semibold text-ui-text">{CARE_ROLE_LABELS[domain]}</h3>
        <span className="flex items-center gap-2 text-xs text-ui-muted">
          {!hasContent && CARE_LABELS.domainEmpty}
          <ChevronDown
            className="w-4 h-4 transition-transform group-open:rotate-180"
            aria-hidden="true"
          />
        </span>
      </summary>
      <div className="px-4 pb-4">
        <AttributeForm residentId={residentId} domain={domain} values={byKey} />

        <div className="mt-6">
          <h4 className="text-sm font-medium text-ui-text mb-3">{CARE_LABELS.appointments}</h4>
          {upcoming.length === 0 && past.length === 0 ? (
            <p className="text-sm text-ui-muted">{CARE_LABELS.appointmentsEmpty}</p>
          ) : (
            <ul className="space-y-3">
              {upcoming.map((item) => (
                <AppointmentRow key={item.id} item={item} canWrite />
              ))}
              {/* A past appointment is a record, not a plan: nobody re-decides
                  whether a meeting that already happened is going to happen. */}
              {past.map((item) => (
                <AppointmentRow key={item.id} item={item} canWrite={false} />
              ))}
            </ul>
          )}
          <AppointmentForm residentId={residentId} domain={domain} />
        </div>
      </div>
    </details>
  )
}

function AttributeForm({
  residentId,
  domain,
  values,
}: {
  residentId: string
  domain: CareRoleId
  values: Map<string, string>
}) {
  async function submit(formData: FormData): Promise<void> {
    await saveCareAttributes(formData)
  }

  return (
    <form action={submit} className="space-y-3">
      <input type="hidden" name="residentId" value={residentId} />
      <input type="hidden" name="domain" value={domain} />
      {CARE_ATTRIBUTE_CATALOG[domain].map((def) => {
        const fieldId = `attr-${domain}-${def.key}`
        const current = values.get(def.key) || ''
        return (
          <div key={def.key}>
            <label htmlFor={fieldId} className="label">
              {def.label}
            </label>
            {def.kind === 'textarea' ? (
              <textarea id={fieldId} name={`attr.${def.key}`} rows={2} className="input" defaultValue={current} />
            ) : def.kind === 'select' ? (
              <select id={fieldId} name={`attr.${def.key}`} className="input" defaultValue={current}>
                <option value="">{CARE_LABELS.unassigned}</option>
                {(def.options || []).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input id={fieldId} name={`attr.${def.key}`} className="input" defaultValue={current} />
            )}
            {def.hint && <p className="text-xs text-ui-muted mt-1">{def.hint}</p>}
          </div>
        )
      })}
      <button type="submit" className="btn-primary min-h-[44px]">
        {CARE_LABELS.save}
      </button>
    </form>
  )
}

function AppointmentForm({ residentId, domain }: { residentId: string; domain: CareRoleId }) {
  async function submit(formData: FormData): Promise<void> {
    await createAppointment(formData)
  }

  return (
    <details className="mt-4">
      <summary className="min-h-[44px] cursor-pointer text-sm font-medium text-brand-primary list-none [&::-webkit-details-marker]:hidden">
        {CARE_LABELS.appointmentAdd}
      </summary>
      <form action={submit} className="mt-3 space-y-3">
        <input type="hidden" name="residentId" value={residentId} />
        <input type="hidden" name="domain" value={domain} />
        <div>
          <label htmlFor={`appt-title-${domain}`} className="label">
            {CARE_LABELS.appointmentTitle}
          </label>
          <input id={`appt-title-${domain}`} name="title" required minLength={2} className="input" />
        </div>
        <div>
          <label htmlFor={`appt-when-${domain}`} className="label">
            {CARE_LABELS.appointmentWhen}
          </label>
          <input id={`appt-when-${domain}`} name="startsAt" type="datetime-local" required className="input" />
        </div>
        <div>
          <label htmlFor={`appt-where-${domain}`} className="label">
            {CARE_LABELS.appointmentWhere}
          </label>
          <input id={`appt-where-${domain}`} name="location" className="input" />
        </div>
        <div>
          <label htmlFor={`appt-notes-${domain}`} className="label">
            {CARE_LABELS.appointmentNotes}
          </label>
          <textarea id={`appt-notes-${domain}`} name="notes" rows={2} className="input" />
          <p className="text-xs text-ui-muted mt-1">{CARE_LABELS.appointmentNotesHint}</p>
        </div>
        <button type="submit" className="btn-primary min-h-[44px]">
          {CARE_LABELS.save}
        </button>
      </form>
    </details>
  )
}

function AppointmentRow({ item, canWrite }: { item: CareAppointment; canWrite: boolean }) {
  async function setStatus(formData: FormData): Promise<void> {
    await setAppointmentStatus(formData)
  }

  return (
    <li className="border border-ui-border rounded-md p-3">
      <p className="font-medium text-ui-text">{item.title}</p>
      <p className="text-sm text-ui-muted">
        {formatZurichDateTime(item.startsAt)}
        {item.location ? ` · ${item.location}` : ''}
        {` · ${item.staffName}`}
        {` · ${APPOINTMENT_STATUS_LABELS[item.status]}`}
      </p>
      {item.notes && <p className="text-sm text-ui-muted mt-1 whitespace-pre-wrap">{item.notes}</p>}
      {canWrite && item.status === 'SCHEDULED' && (
        <div className="flex flex-wrap gap-2 mt-3">
          <form action={setStatus}>
            <input type="hidden" name="id" value={item.id} />
            <input type="hidden" name="status" value="COMPLETED" />
            <button type="submit" className="btn-secondary min-h-[44px] text-sm">
              {CARE_LABELS.markDone}
            </button>
          </form>
          <form action={setStatus}>
            <input type="hidden" name="id" value={item.id} />
            <input type="hidden" name="status" value="CANCELLED" />
            <button type="submit" className="btn-secondary min-h-[44px] text-sm">
              {CARE_LABELS.markCancel}
            </button>
          </form>
        </div>
      )}
    </li>
  )
}
