import Link from 'next/link'
import type { ReactNode } from 'react'
import { Plus, RefreshCw, FileText, Wrench } from 'lucide-react'
import { DASHBOARD_LABELS } from '@/lib/constants/labels'

// =============================================================================
// AllClearState
// =============================================================================

export function AllClearState({ freeBeds, conflictFreeDays }: { freeBeds: number; conflictFreeDays: number }) {
  return (
    <div className="card bg-status-success/10 border-status-success/25 text-center py-12">
      <div className="text-6xl mb-4">🎉</div>
      <h2 className="text-2xl font-bold text-status-success-text mb-2">{DASHBOARD_LABELS.allClearTitle}</h2>
      <p className="text-status-success-text mb-6">
        {conflictFreeDays > 0 && `${conflictFreeDays} ${DASHBOARD_LABELS.allClearConflictFreeSuffix} `}
        {freeBeds > 0 ? `${freeBeds} ${DASHBOARD_LABELS.allClearBedsReadySuffix}` : DASHBOARD_LABELS.allClearAllOccupied}
      </p>
      <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
        <Link href="/residents/new" className="btn-primary w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center">
          {DASHBOARD_LABELS.actionCreateResident}
        </Link>
      </div>
    </div>
  )
}

// =============================================================================
// QuickActionsBar
// =============================================================================

export function QuickActionsBar({ unplacedCount, freeBeds }: { unplacedCount: number; freeBeds: number }) {
  const showMatchingHighlight = unplacedCount > 0 && freeBeds > 0

  return (
    <div className="card">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <h2 className="text-sm font-semibold text-ui-muted uppercase tracking-wide">{DASHBOARD_LABELS.sectionQuickActions}</h2>
        {freeBeds > 0 && (
          <span className="text-xs text-ui-muted">{freeBeds} {DASHBOARD_LABELS.allClearBedsFreeSuffix}</span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <QuickActionButton href="/residents/new" icon={<Plus className="w-4 h-4" />} label={DASHBOARD_LABELS.actionNewResident} variant="primary" />
        <QuickActionButton href="/housing/new" icon={<Plus className="w-4 h-4" />} label={DASHBOARD_LABELS.actionNewUnit} variant="primary" />
        <QuickActionButton
          href="/matching"
          icon={<RefreshCw className="w-4 h-4" />}
          label={DASHBOARD_LABELS.actionStartMatching}
          variant={showMatchingHighlight ? 'highlight' : 'secondary'}
          badge={showMatchingHighlight ? unplacedCount : undefined}
        />
        <QuickActionButton href="/incidents/new" icon={<FileText className="w-4 h-4" />} label={DASHBOARD_LABELS.actionReportIncident} variant="secondary" />
        <QuickActionButton href="/maintenance/new" icon={<Wrench className="w-4 h-4" />} label={DASHBOARD_LABELS.actionMaintenanceTicket} variant="secondary" />
      </div>
    </div>
  )
}

// =============================================================================
// QuickActionButton (internal to this module)
// =============================================================================

function QuickActionButton({
  href,
  icon,
  label,
  variant = 'secondary',
  badge,
}: {
  href: string
  icon: ReactNode
  label: string
  variant?: 'primary' | 'secondary' | 'highlight'
  badge?: number
}) {
  const variantStyles = {
    primary: 'bg-aoz-primary text-ui-on-accent hover:bg-aoz-primary-dark',
    secondary: 'bg-ui-subtle text-ui-muted hover:bg-ui-border',
    highlight: 'bg-aoz-secondary text-ui-on-accent hover:bg-aoz-secondary-dark',
  }

  return (
    <Link
      href={href}
      className={`relative flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-md text-sm font-medium transition-colors ${variantStyles[variant]}`}
    >
      <span>{icon}</span>
      <span>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1.5 -right-1.5 bg-status-error text-ui-on-accent text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {badge}
        </span>
      )}
    </Link>
  )
}
