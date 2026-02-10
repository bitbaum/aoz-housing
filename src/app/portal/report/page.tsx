import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PORTAL_LABELS } from '@/lib/constants/labels'
import { ReportForm } from './ReportForm'

export const dynamic = 'force-dynamic'

export default async function ReportPage() {
  const cookieStore = await cookies()
  const residentCode = cookieStore.get('resident_code')?.value

  if (!residentCode) {
    redirect('/portal')
  }

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
                include: { resident: true },
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
  const roommates = housingUnit?.placements
    .filter(p => p.residentId !== resident.id)
    .map(p => ({ id: p.resident.id, code: p.resident.code })) || []

  return (
    <div>
      <div className="mb-6">
        <Link href="/portal" className="text-aoz-primary hover:underline text-sm">
          {PORTAL_LABELS.form.back}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">{PORTAL_LABELS.pages.report}</h1>
        <p className="text-gray-500">
          {PORTAL_LABELS.pages.reportSubtitle}
        </p>
      </div>

      {!currentPlacement ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-3">{PORTAL_LABELS.report.noPlacement}</p>
          <p className="text-sm text-gray-500 font-medium">{PORTAL_LABELS.report.noPlacementContact}</p>
        </div>
      ) : (
        <ReportForm roommates={roommates} />
      )}

      {/* Emergency Notice */}
      <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="font-medium text-red-800 mb-2">{PORTAL_LABELS.report.emergencyTitle}</h3>
        <p className="text-sm text-red-700">
          {PORTAL_LABELS.report.emergencyMessage}
        </p>
      </div>
    </div>
  )
}
