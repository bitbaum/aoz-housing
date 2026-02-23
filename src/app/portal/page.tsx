import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'

export const metadata: Metadata = { title: 'Mein Bereich' }
import { PORTAL_LABELS } from '@/lib/constants'
import { SatisfactionRating } from '@/components/portal/SatisfactionRating'
import { PortalLanding } from '@/components/portal/PortalLanding'
import { PortalHousingCard, PortalOnboardingCard } from '@/components/portal/PortalHousingCard'
import { PortalQuickActions } from '@/components/portal/PortalQuickActions'
import { PortalPendingChores } from '@/components/portal/PortalPendingChores'
import { PortalRoommatesCard } from '@/components/portal/PortalRoommatesCard'
import { PortalReportsCard } from '@/components/portal/PortalReportsCard'
import { PortalMaintenanceCard } from '@/components/portal/PortalMaintenanceCard'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ error?: string; success?: string }>
}

export default async function ResidentPortal({ searchParams }: PageProps) {
  const params = await searchParams
  const cookieStore = await cookies()
  const residentCode = cookieStore.get('resident_code')?.value

  if (!residentCode) {
    return <PortalLanding error={params.error} />
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
                include: {
                  resident: {
                    select: { id: true, code: true, socialStyle: true },
                  },
                },
              },
              incidents: {
                where: {
                  category: 'MAINTENANCE',
                  resolvedAt: null,
                },
                orderBy: { date: 'desc' },
                take: 5,
                select: { id: true, type: true, date: true },
              },
            },
          },
          checkIns: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      },
      incidentsReported: {
        orderBy: { date: 'desc' },
        take: 5,
        select: { id: true, type: true, description: true, resolvedAt: true },
      },
    },
  })

  if (!resident) {
    // Clear the invalid cookie by redirecting with error
    return <PortalLanding error="account_not_found" />
  }

  const currentPlacement = resident.placements[0]
  const housingUnit = currentPlacement?.housingUnit
  const roommates = housingUnit?.placements
    .filter(p => p.residentId !== resident.id)
    .map(p => p.resident) || []
  const lastCheckIn = currentPlacement?.checkIns?.[0]

  // Get pending chores (NEEDS_ATTENTION or REQUESTED)
  const pendingChores = currentPlacement
    ? await prisma.householdTask.findMany({
        where: {
          housingUnitId: currentPlacement.housingUnitId,
          isCompleted: false,
          currentStatus: { in: ['NEEDS_ATTENTION', 'REQUESTED'] },
        },
        select: { id: true, title: true, currentStatus: true },
        orderBy: { updatedAt: 'desc' },
        take: 3,
      })
    : []

  // Get compatibility scores with roommates
  const compatibilityScores = roommates.length > 0
    ? await prisma.compatibilityAssessment.findMany({
        where: {
          OR: [
            { residentId: resident.id, comparedWithId: { in: roommates.map(r => r.id) } },
            { residentId: { in: roommates.map(r => r.id) }, comparedWithId: resident.id },
          ],
        },
        select: {
          residentId: true,
          comparedWithId: true,
          overallScore: true,
        },
      })
    : []

  return (
    <div>
      {/* Welcome */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {PORTAL_LABELS.pages.dashboard}, {resident.code}
          </h1>
          <p className="text-gray-500 mt-1">
            {PORTAL_LABELS.pages.dashboardSubtitle}
          </p>
        </div>
      </div>

      {/* Satisfaction Check-In - Prominent Position */}
      {currentPlacement && (
        <div className="mb-8">
          <SatisfactionRating
            currentRating={currentPlacement.satisfactionRating}
            lastCheckInDate={lastCheckIn?.createdAt}
          />
        </div>
      )}

      {/* Current Housing */}
      {currentPlacement ? (
        <PortalHousingCard
          placement={currentPlacement}
          housingUnit={housingUnit}
          roommatesCount={roommates.length}
        />
      ) : (
        <PortalOnboardingCard />
      )}

      <PortalQuickActions pendingChoresCount={pendingChores.length} />

      {/* Pending Chores */}
      {currentPlacement && pendingChores.length > 0 && (
        <PortalPendingChores chores={pendingChores} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Roommates Preview */}
        {roommates.length > 0 && (
          <PortalRoommatesCard
            roommates={roommates}
            compatibilityScores={compatibilityScores}
          />
        )}

        {/* Recent Reports */}
        <PortalReportsCard incidents={resident.incidentsReported} />

        {/* Open Maintenance in Building */}
        {housingUnit && housingUnit.incidents.length > 0 && (
          <PortalMaintenanceCard incidents={housingUnit.incidents} />
        )}
      </div>
    </div>
  )
}
