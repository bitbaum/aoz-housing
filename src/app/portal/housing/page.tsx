import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { db, resident as residentTable, placement, housingUnit, placementSpot } from '@/lib/db'
import { eq, and, ne, asc } from 'drizzle-orm'
import { toResidentProfile } from '@/lib/compatibility/convert'
import { calculateApartmentProfile, calculateApartmentFit } from '@/lib/compatibility/aggregate'
import { PortalHousingBrowse } from '@/components/portal/PortalHousingBrowse'
import { requireResidentCookie } from '@/lib/portal-auth'
import Link from 'next/link'
import { getRequestTranslator } from '@/lib/i18n/request'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestTranslator()
  return { title: t('nav.housing') }
}
export const dynamic = 'force-dynamic'

export default async function PortalHousingPage() {
  const residentCode = await requireResidentCookie('/portal')
  const { t } = await getRequestTranslator()

  const resident = await db.query.resident.findFirst({
    where: eq(residentTable.code, residentCode),
  })

  if (!resident) {
    redirect('/portal')
  }

  // Redirect to preferences if not completed yet
  if (!resident.preferencesCompletedAt) {
    redirect('/portal/preferences')
  }

  // Check if already placed — redirect to dashboard
  const activePlacement = await db.query.placement.findFirst({
    where: and(eq(placement.residentId, resident.id), eq(placement.status, 'ACTIVE')),
  })
  if (activePlacement) {
    redirect('/portal')
  }

  // Fetch available housing units with current residents and available spots
  const units = await db.query.housingUnit.findMany({
    where: eq(housingUnit.status, 'AVAILABLE'),
    with: {
      placements: {
        where: eq(placement.status, 'ACTIVE'),
        with: { resident: true },
      },
      spots: {
        where: and(eq(placementSpot.status, 'AVAILABLE'), ne(placementSpot.type, 'ROOM')),
      },
    },
    orderBy: [asc(housingUnit.code)],
  })

  const residentProfile = toResidentProfile(resident)

  const results = units
    .filter((unit) => unit.spots.length > 0)
    .map((unit) => {
      const currentResidents = unit.placements.map((p) => p.resident)
      const profile = calculateApartmentProfile(currentResidents.map(toResidentProfile))
      const fit = calculateApartmentFit(residentProfile, profile)
      return {
        unitId: unit.id,
        address: unit.address,
        availableSpots: unit.spots.length,
        currentResidentCount: currentResidents.length,
        fitScore: fit.fitScore,
        strengths: fit.strengths,
        concerns: fit.warnings,
        conflicts: fit.conflicts.map((c) => ({ severity: c.severity, message: c.message })),
        isEmpty: currentResidents.length === 0,
        features: {
          sharedKitchen: unit.sharedKitchen,
          privateKitchen: unit.privateKitchen,
          smokingAllowed: unit.smokingAllowed,
          petsAllowed: unit.petsAllowed,
          wheelchairAccess: unit.wheelchairAccess,
          groundFloor: unit.groundFloor,
          elevator: unit.elevator,
        },
      }
    })
    .filter((r) => !r.conflicts.some((c) => c.severity === 'BLOCKING'))
    .sort((a, b) => b.fitScore - a.fitScore)

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/portal"
          className="text-sm text-ui-muted hover:text-brand-primary min-h-[44px] inline-flex items-center"
        >
          {t('action.back')}
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-ui-text mt-2">{t('nav.housing')}</h1>
        <p className="text-ui-muted mt-1">{t('housing.subtitle')}</p>
      </div>

      <PortalHousingBrowse results={results} />
    </div>
  )
}
