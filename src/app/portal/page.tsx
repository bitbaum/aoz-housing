import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export const metadata: Metadata = { title: 'Mein Bereich' }
import { PORTAL_LABELS } from '@/lib/constants'
import { DISPLAY_LIMITS } from '@/lib/config/thresholds'
import { SatisfactionRating } from '@/components/portal/SatisfactionRating'
import { PortalHousingCard, PortalOnboardingCard } from '@/components/portal/PortalHousingCard'
import { PortalQuickActions } from '@/components/portal/PortalQuickActions'
import { PortalPendingChores } from '@/components/portal/PortalPendingChores'
import { PortalRoommatesCard } from '@/components/portal/PortalRoommatesCard'
import { PortalReportsCard } from '@/components/portal/PortalReportsCard'
import { PortalMaintenanceCard } from '@/components/portal/PortalMaintenanceCard'
import { PortalActivitiesCard } from '@/components/portal/PortalActivitiesCard'
import { listActivities } from '@/lib/data/activities'

export const dynamic = 'force-dynamic'

export default async function ResidentPortal() {
  const cookieStore = await cookies()
  const residentCode = cookieStore.get('resident_code')?.value

  if (!residentCode) {
    redirect('/login')
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
                take: DISPLAY_LIMITS.portalIncidentPreview,
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
        take: DISPLAY_LIMITS.portalIncidentPreview,
        select: { id: true, type: true, description: true, resolvedAt: true },
      },
    },
  })

  if (!resident) {
    redirect('/login')
  }

  const currentPlacement = resident.placements[0]
  const housingUnit = currentPlacement?.housingUnit
  const roommates = housingUnit?.placements
    .filter(p => p.residentId !== resident.id)
    .map(p => p.resident) || []
  const lastCheckIn = currentPlacement?.checkIns?.[0]

  const now = new Date()
  const [pendingChores, compatibilityScores, highlightedActivities] = await Promise.all([
    currentPlacement
      ? prisma.householdTask.findMany({
          where: {
            housingUnitId: currentPlacement.housingUnitId,
            isCompleted: false,
            currentStatus: { in: ['NEEDS_ATTENTION', 'REQUESTED'] },
          },
          select: { id: true, title: true, currentStatus: true },
          orderBy: { updatedAt: 'desc' },
          take: DISPLAY_LIMITS.dashboardItems,
        })
      : Promise.resolve([]),
    roommates.length > 0
      ? prisma.compatibilityAssessment.findMany({
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
      : Promise.resolve([]),
    listActivities({
      publishedOnly: true,
      highlightedOnly: true,
      activeOn: now,
      take: DISPLAY_LIMITS.dashboardItems,
    }),
  ])

  return (
    <div>
      {/* Welcome */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-ui-text">
            {PORTAL_LABELS.pages.dashboard}, {resident.code}
          </h1>
          <p className="text-ui-muted mt-1">
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
        <PortalOnboardingCard preferencesCompleted={resident.preferencesCompletedAt !== null} />
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

        {/* Activities */}
        <PortalActivitiesCard activities={highlightedActivities} />
      </div>
    </div>
  )
}
