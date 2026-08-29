'use client'

import { CARE_LABELS, CARE_ROLE_LABELS, CARE_ROLES, type CareRoleId } from '@/lib/config/care'
import type { AssignableStaff, CareSeat } from '@/lib/actions/care'
import { saveCareSeat } from '@/lib/actions/care'

interface CareTeamCardProps {
  residentId?: string
  seats: CareSeat[]
  staffOptions?: AssignableStaff[]
  canWrite?: boolean
  writableDomains?: CareRoleId[]
  title: string
  subtitle?: string
  empty: string
  roleLabels?: Record<CareRoleId, string>
}

export function CareTeamCard({
  residentId,
  seats,
  staffOptions = [],
  canWrite = false,
  writableDomains,
  title,
  subtitle,
  empty,
  roleLabels = CARE_ROLE_LABELS,
}: CareTeamCardProps) {
  const writable = new Set(writableDomains ?? (canWrite ? CARE_ROLES : []))
  const filled = seats.filter((seat) => seat.staffName)

  async function submitSeat(formData: FormData): Promise<void> {
    await saveCareSeat(formData)
  }

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-ui-text">{title}</h2>
      {subtitle && <p className="text-sm text-ui-muted mt-1 mb-4">{subtitle}</p>}

      {residentId && writable.size > 0 ? (
        <ul className="space-y-3">
          {CARE_ROLES.map((role) => {
            const seat = seats.find((item) => item.role === role)
            if (!writable.has(role)) {
              return (
                <li key={role} className="flex items-baseline justify-between gap-3">
                  <span className="text-sm text-ui-muted">{roleLabels[role]}</span>
                  <span className="text-sm font-medium text-ui-text">
                    {seat?.staffName || CARE_LABELS.unassigned}
                  </span>
                </li>
              )
            }
            return (
              <li key={role}>
                <form
                  action={submitSeat}
                  className="grid grid-cols-1 sm:grid-cols-[10rem_1fr] gap-2 items-center"
                >
                  <input type="hidden" name="residentId" value={residentId} />
                  <input type="hidden" name="role" value={role} />
                  <label htmlFor={`care-${role}`} className="text-sm font-medium text-ui-text">
                    {roleLabels[role]}
                  </label>
                  <select
                    id={`care-${role}`}
                    name="staffId"
                    className="input"
                    defaultValue={seat?.staffId ?? ''}
                    onChange={(event) => event.currentTarget.form?.requestSubmit()}
                  >
                    <option value="">{CARE_LABELS.unassigned}</option>
                    {staffOptions.map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.name}
                      </option>
                    ))}
                  </select>
                </form>
              </li>
            )
          })}
        </ul>
      ) : filled.length === 0 ? (
        <p className="text-sm text-ui-muted mt-3">{empty}</p>
      ) : (
        <ul className="space-y-3 mt-3">
          {seats.map((seat) => (
            <li key={seat.role} className="flex items-baseline justify-between gap-3">
              <span className="text-sm text-ui-muted">{roleLabels[seat.role]}</span>
              <span className="text-sm font-medium text-ui-text">
                {seat.staffName || CARE_LABELS.unassigned}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
