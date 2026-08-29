import type { Metadata } from 'next'
import { getRequestTranslator } from '@/lib/i18n/request'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestTranslator()
  return { title: t('nav.report') }
}
import { ReportForm } from './ReportForm'
import { requireResidentCookie } from '@/lib/portal-auth'
import { PageHeader } from '@/components/ui/Page'
import { RESIDENT_NAME_SELECT } from '@/lib/utils/resident-name'
import { contactFallbackSentence } from '@/lib/contact/fallback'

export const dynamic = 'force-dynamic'

export default async function ReportPage() {
  const residentCode = await requireResidentCookie('/portal')
  const { t } = await getRequestTranslator()

  const resident = await prisma.resident.findUnique({
    where: { code: residentCode },
    include: {
      placements: {
        where: { status: 'ACTIVE' },
        include: {
          housingUnit: {
            include: {
              placements: {
                where: { status: 'ACTIVE' },
                include: {
                  resident: {
                    select: RESIDENT_NAME_SELECT,
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  if (!resident) {
    redirect('/portal?error=account_not_found')
  }

  const currentPlacement = resident.placements[0]
  const housingUnit = currentPlacement?.housingUnit
  const roommates =
    housingUnit?.placements
      .filter((p) => p.residentId !== resident.id)
      .map((p) => ({
        id: p.resident.id,
        code: p.resident.code,
        displayName: p.resident.displayName,
      })) || []

  return (
    <div>
      <div className="mb-6">
        <PageHeader
          title={t('report.title')}
          description={t('report.subtitle')}
          backHref="/portal"
          backLabel={t('action.back')}
        />
      </div>

      {!currentPlacement ? (
        <div className="card text-center py-12">
          <p className="text-ui-muted mb-3">{t('report.noPlacement')}</p>
          <p className="text-sm text-ui-muted font-medium">{contactFallbackSentence(t)}</p>
        </div>
      ) : (
        <ReportForm roommates={roommates} />
      )}

      {/* Emergency Notice */}
      <div className="mt-8 p-4 bg-status-error/8 border border-status-error/25 rounded-lg">
        <h3 className="font-medium text-status-error-text mb-2">{t('report.emergencyTitle')}</h3>
        <p className="text-sm text-status-error-text">{t('report.emergencyMessage')}</p>
      </div>
    </div>
  )
}
