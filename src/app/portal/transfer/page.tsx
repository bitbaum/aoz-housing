import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { PORTAL_LABELS } from '@/lib/constants/labels'
import { TransferRequestForm } from '@/components/portal/TransferRequestForm'
import { requireResidentCookie } from '@/lib/portal-auth'
import { PageHeader } from '@/components/ui/Page'

export const metadata: Metadata = { title: 'Verlegung anfragen' }
export const dynamic = 'force-dynamic'

export default async function TransferPage() {
  const residentCode = await requireResidentCookie('/portal')

  const resident = await prisma.resident.findUnique({
    where: { code: residentCode },
    include: {
      placements: {
        where: { status: 'ACTIVE' },
        take: 1,
        include: {
          housingUnit: { select: { id: true, code: true, address: true } },
        },
      },
      transferRequests: {
        where: { status: 'PENDING' },
        take: 1,
        select: { id: true, createdAt: true, reason: true },
      },
    },
  })

  if (!resident) {
    redirect('/portal?error=account_not_found')
  }

  const placement = resident.placements[0]
  const pendingRequest = resident.transferRequests[0]

  // Fetch available units for optional target selection (exclude current unit)
  const availableUnits = placement
    ? await prisma.housingUnit.findMany({
        where: {
          status: 'AVAILABLE',
          id: { not: placement.housingUnit?.id },
        },
        select: { id: true, code: true, address: true },
        orderBy: { code: 'asc' },
      })
    : []

  const L = PORTAL_LABELS.transfer

  return (
    <div>
      <div className="mb-6">
        <PageHeader
          title={L.title}
          description={L.subtitle}
          backHref="/portal"
          backLabel={PORTAL_LABELS.form.back.replace(/^← /, '')}
        />
      </div>

      {!placement ? (
        <div className="card text-center py-12">
          <p className="text-ui-muted">{L.noPlacement}</p>
        </div>
      ) : pendingRequest ? (
        <div className="card">
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📋</div>
            <h2 className="text-lg font-semibold text-ui-text mb-2">{L.pendingTitle}</h2>
            <p className="text-ui-muted max-w-md mx-auto">{L.pendingMessage}</p>
          </div>
        </div>
      ) : (
        <TransferRequestForm
          currentUnit={placement.housingUnit ? {
            code: placement.housingUnit.code,
            address: placement.housingUnit.address,
          } : undefined}
          availableUnits={availableUnits}
        />
      )}
    </div>
  )
}
