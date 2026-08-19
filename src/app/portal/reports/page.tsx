import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { requireResidentCookie } from '@/lib/portal-auth'
import { mergeResidentReports } from '@/lib/reports/resident-reports'
import { getRequestTranslator } from '@/lib/i18n/request'
import { PageHeader, EmptyState } from '@/components/ui/Page'
import { ResidentReportItem } from '@/components/portal/ResidentReportItem'

export const metadata: Metadata = { title: 'Reports' }

export const dynamic = 'force-dynamic'

/**
 * Everything this resident has reported, in one list.
 *
 * The page exists because "I filed something and cannot find it" was true of
 * the product: reports were rendered only as a five-item preview eight cards
 * down the dashboard, the "Melden" nav entry opened the submission form rather
 * than the list, and the confirmation screen after filing linked nowhere. A
 * report you cannot find is indistinguishable from one that was never saved —
 * and the whole point of routing reports to the right desk is undone if the
 * person who filed one cannot see that it arrived.
 *
 * No limit is passed to the merge: this is the page that must show everything.
 */
export default async function PortalReportsPage() {
  const residentCode = await requireResidentCookie('/portal')
  const { t } = await getRequestTranslator()

  const resident = await prisma.resident.findUnique({
    where: { code: residentCode },
    select: {
      id: true,
      incidentsReported: {
        orderBy: { date: 'desc' },
        select: {
          id: true,
          type: true,
          description: true,
          date: true,
          resolvedAt: true,
          resolution: true,
        },
      },
      maintenanceRequests: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          category: true,
          description: true,
          createdAt: true,
          status: true,
          resolution: true,
        },
      },
    },
  })

  if (!resident) {
    redirect('/portal?error=account_not_found')
  }

  const reports = mergeResidentReports(resident.incidentsReported, resident.maintenanceRequests)
  const open = reports.filter((report) => !report.isDone)
  const done = reports.filter((report) => report.isDone)

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('reports.title')}
        description={t('reports.subtitle')}
        backHref="/portal"
        actions={
          <Link href="/portal/report" className="btn-secondary">
            {t('dashboard.newReport')}
          </Link>
        }
      />

      {reports.length === 0 ? (
        <EmptyState
          title={t('reports.empty')}
          action={
            <Link href="/portal/report" className="btn-secondary">
              {t('reports.emptyAction')}
            </Link>
          }
        />
      ) : (
        <>
          {open.length > 0 && (
            <ReportSection title={t('reports.openSection')} count={open.length} reports={open} />
          )}
          {done.length > 0 && (
            <ReportSection title={t('reports.doneSection')} count={done.length} reports={done} />
          )}
        </>
      )}
    </div>
  )
}

function ReportSection({
  title,
  count,
  reports,
}: {
  title: string
  count: number
  reports: ReturnType<typeof mergeResidentReports>
}) {
  return (
    <section>
      <div className="flex items-baseline gap-2 mb-3">
        <h2 className="text-lg font-semibold text-ui-text">{title}</h2>
        <span className="numeric text-sm text-ui-muted">{count}</span>
      </div>
      <div className="space-y-3">
        {reports.map((report) => (
          <ResidentReportItem key={`${report.kind}-${report.id}`} report={report} />
        ))}
      </div>
    </section>
  )
}
