import Link from 'next/link'
import { DISPLAY_LIMITS } from '@/lib/config/thresholds'
import { DASHBOARD_LABELS } from '@/lib/constants/labels'

// =============================================================================
// ActionTile
// =============================================================================

export interface ActionTileProps {
  title: string
  count: number
  description: string
  href: string
  color: 'orange' | 'blue' | 'red' | 'green'
  items: { label: string; sublabel: string; href: string }[]
  allHref: string
}

export function ActionTile({ title, count, description, href, color, items, allHref }: ActionTileProps) {
  const colorStyles = {
    orange: 'border-status-warning/30 hover:border-status-warning/50',
    blue: 'border-status-info/30 hover:border-status-info/50',
    red: 'border-status-error/30 hover:border-status-error/50',
    green: 'border-status-success/30 hover:border-status-success/50',
  }

  const badgeStyles = {
    orange: 'bg-status-warning/15 text-status-warning-text',
    blue: 'bg-status-info/15 text-status-info-text',
    red: 'bg-status-error/15 text-status-error-text',
    green: 'bg-status-success/15 text-status-success-text',
  }

  return (
    <div className={`card border-2 ${colorStyles[color]} transition-colors`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-ui-text">{title}</h3>
          <p className="text-sm text-ui-muted">{description}</p>
        </div>
        <span className={`px-2 py-1 rounded-sm text-sm font-bold ${badgeStyles[color]}`}>
          {count}
        </span>
      </div>

      <div className="space-y-2">
        {items.map((item, i) => (
          <Link
            key={i}
            href={item.href}
            className="flex items-center justify-between py-2 px-3 bg-ui-subtle rounded-lg hover:bg-ui-subtle transition-colors"
          >
            <div>
              <span className="font-medium text-ui-text text-sm">{item.label}</span>
              <span className="text-ui-muted text-sm ml-2">{item.sublabel}</span>
            </div>
            <span className="text-ui-muted">→</span>
          </Link>
        ))}
      </div>

      {count > DISPLAY_LIMITS.dashboardItems && (
        <Link
          href={allHref}
          className="block text-center mt-3 pt-3 border-t border-ui-border text-sm text-ui-muted hover:text-ui-text"
        >
          {DASHBOARD_LABELS.showAllPrefix} {count} {DASHBOARD_LABELS.showAllSuffix} →
        </Link>
      )}
    </div>
  )
}
