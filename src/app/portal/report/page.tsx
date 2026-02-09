import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
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
    redirect('/portal')
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
          ← Zurück zur Übersicht
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Problem melden</h1>
        <p className="text-gray-500">
          Melde technische Probleme oder Konflikte
        </p>
      </div>

      <ReportForm
        residentId={resident.id}
        housingUnitId={housingUnit?.id || ''}
        roommates={roommates}
      />

      {/* Emergency Notice */}
      <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="font-medium text-red-800 mb-2">Bei Notfällen</h3>
        <p className="text-sm text-red-700">
          Bei akuter Gefahr oder medizinischen Notfällen rufe sofort <strong>112</strong> an.
          Diese Meldung ist <strong>nicht</strong> für Notfälle gedacht.
        </p>
      </div>
    </div>
  )
}
