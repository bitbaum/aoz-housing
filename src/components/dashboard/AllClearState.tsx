import Link from 'next/link'
import { DASHBOARD_LABELS } from '@/lib/constants/labels'

// =============================================================================
// AllClearState
// =============================================================================

export function AllClearState({ freeBeds, conflictFreeDays }: { freeBeds: number; conflictFreeDays: number }) {
  return (
    <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 text-center py-12">
      <div className="text-6xl mb-4">🎉</div>
      <h2 className="text-2xl font-bold text-green-800 mb-2">{DASHBOARD_LABELS.allClearTitle}</h2>
      <p className="text-green-600 mb-6">
        {conflictFreeDays > 0 && `${conflictFreeDays} ${DASHBOARD_LABELS.allClearConflictFreeSuffix} `}
        {freeBeds > 0 ? `${freeBeds} ${DASHBOARD_LABELS.allClearBedsReadySuffix}` : DASHBOARD_LABELS.allClearAllOccupied}
      </p>
      <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
        <Link href="/residents/new" className="btn-primary w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center">
          {DASHBOARD_LABELS.actionCreateResident}
        </Link>
        <Link href="/analytics" className="btn-outline w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center">
          {DASHBOARD_LABELS.actionViewStats}
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
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{DASHBOARD_LABELS.sectionQuickActions}</h2>
        {freeBeds > 0 && (
          <span className="text-xs text-gray-500">{freeBeds} {DASHBOARD_LABELS.allClearBedsFreeSuffix}</span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <QuickActionButton href="/residents/new" icon="+" label={DASHBOARD_LABELS.actionNewResident} variant="primary" />
        <QuickActionButton href="/housing/new" icon="+" label={DASHBOARD_LABELS.actionNewUnit} variant="primary" />
        <QuickActionButton
          href="/matching"
          icon="🔄"
          label={DASHBOARD_LABELS.actionStartMatching}
          variant={showMatchingHighlight ? 'highlight' : 'secondary'}
          badge={showMatchingHighlight ? unplacedCount : undefined}
        />
        <QuickActionButton href="/incidents/new" icon="📝" label={DASHBOARD_LABELS.actionReportIncident} variant="secondary" />
        <QuickActionButton href="/maintenance/new" icon="🔧" label={DASHBOARD_LABELS.actionMaintenanceTicket} variant="secondary" />
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
  icon: string
  label: string
  variant?: 'primary' | 'secondary' | 'highlight'
  badge?: number
}) {
  const variantStyles = {
    primary: 'bg-aoz-primary text-white hover:bg-aoz-primary-dark',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    highlight: 'bg-aoz-secondary text-white hover:bg-aoz-secondary-dark',
  }

  return (
    <Link
      href={href}
      className={`relative flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-md text-sm font-medium transition-colors ${variantStyles[variant]}`}
    >
      <span>{icon}</span>
      <span>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {badge}
        </span>
      )}
    </Link>
  )
}
