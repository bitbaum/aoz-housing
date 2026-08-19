'use client'

import Link from 'next/link'
import { AlertTriangle, Clock, Home, User, Briefcase, Heart, BookOpen, TriangleAlert } from 'lucide-react'
import {
  AGE_RANGE_LABELS,
  GENDER_LABELS_SHORT,
  RESIDENT_STATUS_LABELS,
  LANGUAGE_LABELS,
  getLabel,
} from '@/lib/constants'
import { SUPPORT_LEVEL_LABELS } from '@/lib/constants/labels/residents'
import { CARE_ROLE_LABELS } from '@/lib/config/care'
import { residentInitials, residentName } from '@/lib/utils/resident-name'
import { EmptyState } from '@/components/ui/Page'

export interface ClientBoardItem {
  id: string
  code: string
  displayName: string | null
  ageRange: string
  gender: string
  status: string
  supportLevel: string
  languages: string[]
  createdAt: Date | string
  placements: {
    housingUnit: { code: string }
    startDate: Date | string
    checkIns: { createdAt: Date | string }[]
  }[]
  careSeats: {
    role: string
    staff: { name: string } | null
  }[]
  incidentCount: number
  daysSinceCheckIn: number | null
  checkInIntervalDays: number
}

const ROLE_ICONS = {
  HOUSING: Home,
  SOCIAL: User,
  JOB: Briefcase,
  VOLUNTEERING: Heart,
} as const

const ROLE_COLORS = {
  HOUSING: 'text-score-good',
  SOCIAL: 'text-brand-primary',
  JOB: 'text-score-medium',
  VOLUNTEERING: 'text-score-excellent',
} as const

function SupportBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    INTENSIVE: 'bg-score-critical/10 text-score-critical border border-score-critical/20',
    ELEVATED: 'bg-score-medium/10 text-score-medium border border-score-medium/20',
    STANDARD: 'bg-ui-subtle text-ui-muted border border-ui-border',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[level] ?? colors.STANDARD}`}>
      {SUPPORT_LEVEL_LABELS[level] ?? level}
    </span>
  )
}

function CheckInIndicator({ daysSince, intervalDays }: { daysSince: number | null; intervalDays: number }) {
  if (daysSince === null) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-ui-muted">
        <Clock className="w-3.5 h-3.5" />
        Noch kein Check-in
      </span>
    )
  }

  const isVeryOverdue = daysSince > intervalDays + 14
  const isOverdue = daysSince > intervalDays
  const isDueSoon = !isOverdue && (intervalDays - daysSince) <= 5

  if (isVeryOverdue) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-score-critical">
        <AlertTriangle className="w-3.5 h-3.5" />
        {daysSince}T ohne Check-in
      </span>
    )
  }
  if (isOverdue) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-score-medium">
        <Clock className="w-3.5 h-3.5" />
        {daysSince}T ohne Check-in
      </span>
    )
  }
  if (isDueSoon) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-score-good">
        <Clock className="w-3.5 h-3.5" />
        Fällig in {intervalDays - daysSince}T
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-ui-muted">
      <Clock className="w-3.5 h-3.5" />
      Vor {daysSince}T
    </span>
  )
}

function ClientCard({ client }: { client: ClientBoardItem }) {
  const placement = client.placements[0]
  const assignedRoles = client.careSeats.filter(s => s.staff)
  const unassignedRoles = client.careSeats.filter(s => !s.staff)
  const isVeryOverdue = client.daysSinceCheckIn !== null && client.daysSinceCheckIn > client.checkInIntervalDays + 14
  const isOverdue = client.daysSinceCheckIn !== null && client.daysSinceCheckIn > client.checkInIntervalDays

  return (
    <Link
      href={`/residents/${client.id}`}
      className={`group block rounded-xl border bg-ui-surface p-4 transition-all hover:shadow-md hover:border-brand-primary/40 hover:-translate-y-0.5 ${
        isVeryOverdue
          ? 'border-score-critical/40'
          : isOverdue
          ? 'border-score-medium/40'
          : 'border-ui-border'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-mono text-sm font-bold ${
            isVeryOverdue
              ? 'bg-score-critical/10 text-score-critical'
              : 'bg-ui-subtle text-ui-text group-hover:bg-brand-primary/10 group-hover:text-brand-primary'
          }`}>
            {residentInitials(client)}
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-ui-text truncate group-hover:text-brand-primary text-sm leading-tight">
              {residentName(client)}
            </p>
            <p className="text-xs text-ui-muted font-mono">{client.code}</p>
          </div>
        </div>
        <SupportBadge level={client.supportLevel} />
      </div>

      {/* Housing */}
      <div className="mb-2.5">
        {placement ? (
          <span className="inline-flex items-center gap-1.5 text-sm text-ui-muted">
            <Home className="w-3.5 h-3.5" />
            {placement.housingUnit.code}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-sm text-status-warning-text font-medium">
            <TriangleAlert className="w-3.5 h-3.5" />
            Nicht platziert
          </span>
        )}
      </div>

      {/* Check-in status */}
      <div className="mb-3">
        <CheckInIndicator daysSince={client.daysSinceCheckIn} intervalDays={client.checkInIntervalDays} />
      </div>

      {/* Care team */}
      {client.careSeats.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {assignedRoles.map(seat => {
            const Icon = ROLE_ICONS[seat.role as keyof typeof ROLE_ICONS] ?? User
            const color = ROLE_COLORS[seat.role as keyof typeof ROLE_COLORS] ?? 'text-ui-muted'
            return (
              <span key={seat.role} className="inline-flex items-center gap-1 text-xs text-ui-muted bg-ui-subtle rounded-full px-2 py-0.5" title={`${CARE_ROLE_LABELS[seat.role as keyof typeof CARE_ROLE_LABELS] ?? seat.role}: ${seat.staff?.name}`}>
                <Icon className={`w-3 h-3 ${color}`} aria-hidden="true" />
                <span className="truncate max-w-[80px]">{seat.staff?.name?.split(' ')[0]}</span>
              </span>
            )
          })}
          {unassignedRoles.map(seat => {
            const Icon = ROLE_ICONS[seat.role as keyof typeof ROLE_ICONS] ?? User
            return (
              <span key={seat.role} className="inline-flex items-center gap-1 text-xs text-ui-muted/50 bg-ui-subtle/50 rounded-full px-2 py-0.5 border border-dashed border-ui-border" title={`${CARE_ROLE_LABELS[seat.role as keyof typeof CARE_ROLE_LABELS] ?? seat.role}: nicht zugewiesen`}>
                <Icon className="w-3 h-3" aria-hidden="true" />
                <span>—</span>
              </span>
            )
          })}
        </div>
      )}

      {/* Footer: incidents */}
      {client.incidentCount > 0 && (
        <div className="pt-2 border-t border-ui-border">
          <span className="inline-flex items-center gap-1 text-xs text-score-medium">
            <AlertTriangle className="w-3.5 h-3.5" />
            {client.incidentCount} Vorfall{client.incidentCount !== 1 ? 'fälle' : ''} (30T)
          </span>
        </div>
      )}
    </Link>
  )
}

export function ClientBoard({ clients }: { clients: ClientBoardItem[] }) {
  if (clients.length === 0) {
    return (
      <EmptyState
        title="Keine Klient*innen gefunden"
        description="Neue Klient*innen werden über den Erfassungsprozess angelegt."
      />
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {clients.map(client => (
        <ClientCard key={client.id} client={client} />
      ))}
    </div>
  )
}
