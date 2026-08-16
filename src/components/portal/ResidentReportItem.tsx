import { PORTAL_LABELS } from '@/lib/constants'
import { DISPLAY_LIMITS } from '@/lib/config/thresholds'
import type { ResidentReport } from '@/lib/reports/resident-reports'

/**
 * One reported item, as the resident who filed it sees it.
 *
 * Shared by the dashboard preview and the full reports page so the two cannot
 * drift: the same report must not look answered in one place and open in the
 * other, and the staff answer must appear wherever the report does.
 */
export function ResidentReportItem({
  report,
  truncate = false,
}: {
  report: ResidentReport
  /** The dashboard clips long descriptions; the full page shows all of it. */
  truncate?: boolean
}) {
  const L = PORTAL_LABELS.dashboard
  const clipped =
    truncate && report.description.length > DISPLAY_LIMITS.descriptionPreview

  return (
    <div className="p-3 bg-ui-subtle rounded-lg">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-ui-text text-sm">{report.title}</p>
          <p className="text-sm text-ui-muted mt-1 whitespace-pre-line">
            {clipped
              ? `${report.description.slice(0, DISPLAY_LIMITS.descriptionPreview)}...`
              : report.description}
          </p>
          <p className="text-sm text-ui-muted mt-1">
            {report.isDone ? L.reportResolved : L.reportPending}
          </p>
        </div>
        <span className={`badge ${report.isDone ? 'badge-active' : 'badge-pending'} shrink-0`}>
          {report.isDone ? L.resolved : `${L.open} · ${L.inProgress}`}
        </span>
      </div>

      {/* An answer that stays in the database is the same as no answer. This is
          the only place a resident learns what staff did. */}
      {report.answer && (
        <div className="mt-3 border-t border-ui-border pt-3">
          <p className="eyebrow">{L.reportAnswer}</p>
          <p className="text-sm text-ui-text mt-1 whitespace-pre-line">{report.answer}</p>
        </div>
      )}
    </div>
  )
}
