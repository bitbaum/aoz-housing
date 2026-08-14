import Link from 'next/link'
import { PORTAL_LABELS } from '@/lib/constants'
import { DISPLAY_LIMITS } from '@/lib/config/thresholds'
import type { ResidentReport } from '@/lib/reports/resident-reports'

interface PortalReportsCardProps {
  reports: ResidentReport[]
}

export function PortalReportsCard({ reports }: PortalReportsCardProps) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-ui-text">{PORTAL_LABELS.dashboard.myReports}</h2>
        <Link href="/portal/report" className="inline-flex items-center min-h-[44px] px-1 text-sm text-brand-primary hover:underline">
          {PORTAL_LABELS.dashboard.newReport}
        </Link>
      </div>

      {reports.length === 0 ? (
        <p className="text-ui-muted text-center py-6">
          {PORTAL_LABELS.dashboard.noReports}
        </p>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <div
              key={`${report.kind}-${report.id}`}
              className="p-3 bg-ui-subtle rounded-lg"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-ui-text text-sm">{report.title}</p>
                  <p className="text-sm text-ui-muted mt-1">
                    {report.description.slice(0, DISPLAY_LIMITS.descriptionPreview)}
                    {report.description.length > DISPLAY_LIMITS.descriptionPreview && '...'}
                  </p>
                  <p className="text-sm text-ui-muted mt-1">
                    {report.isDone ? PORTAL_LABELS.dashboard.reportResolved : PORTAL_LABELS.dashboard.reportPending}
                  </p>
                </div>
                <span className={`badge ${report.isDone ? 'badge-active' : 'badge-pending'} shrink-0`}>
                  {report.isDone ? PORTAL_LABELS.dashboard.resolved : `${PORTAL_LABELS.dashboard.open} · ${PORTAL_LABELS.dashboard.inProgress}`}
                </span>
              </div>

              {/* An answer that stays in the database is the same as no answer.
                  This is the only place a resident learns what staff did. */}
              {report.answer && (
                <div className="mt-3 border-t border-ui-border pt-3">
                  <p className="eyebrow">{PORTAL_LABELS.dashboard.reportAnswer}</p>
                  <p className="text-sm text-ui-text mt-1">{report.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
