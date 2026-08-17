import { CARE_ROLE_LABELS, type CareRoleId } from '@/lib/config/care'
import type { CareAppointment } from '@/lib/actions/care'
import { formatZurichDateTime } from '@/lib/utils/local-time'

interface PortalAppointmentsCardProps {
  title: string
  empty: string
  appointments: CareAppointment[]
}

export function PortalAppointmentsCard({
  title,
  empty,
  appointments,
}: PortalAppointmentsCardProps) {
  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-ui-text">{title}</h2>
      {appointments.length === 0 ? (
        <p className="text-sm text-ui-muted mt-3">{empty}</p>
      ) : (
        <ul className="space-y-3 mt-3">
          {appointments.map((item) => (
            <li key={item.id} className="flex flex-col gap-1">
              <span className="font-medium text-ui-text">{item.title}</span>
              <span className="text-sm text-ui-muted">
                {formatZurichDateTime(item.startsAt)}
                {` · ${CARE_ROLE_LABELS[item.domain as CareRoleId]}`}
                {` · ${item.staffName}`}
                {item.location ? ` · ${item.location}` : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
