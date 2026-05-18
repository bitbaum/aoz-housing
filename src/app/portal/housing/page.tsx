import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { PORTAL_LABELS } from '@/lib/constants'
import { toResidentProfile } from '@/lib/compatibility/convert'
import { calculateApartmentProfile, calculateApartmentFit } from '@/lib/compatibility/aggregate'
import { PortalHousingBrowse } from '@/components/portal/PortalHousingBrowse'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Verfügbare Unterkünfte' }
export const dynamic = 'force-dynamic'

export default async function PortalHousingPage() {
  const cookieStore = await cookies()
  const residentCode = cookieStore.get('resident_code')?.value

  if (!residentCode) {
    redirect('/portal')
  }

  const resident = await prisma.resident.findUnique({
    where: { code: residentCode },
  })

  if (!resident) {
    redirect('/portal')
  }

  // Redirect to preferences if not completed yet
  if (!resident.preferencesCompletedAt) {
    redirect('/portal/preferences')
  }

  // Check if already placed — redirect to dashboard
  const activePlacement = await prisma.placement.findFirst({
    where: { residentId: resident.id, status: 'ACTIVE' },
  })
  if (activePlacement) {
    redirect('/portal')
  }

  // Fetch available housing units with current residents and available spots
  const units = await prisma.housingUnit.findMany({
    where: { status: 'AVAILABLE' },
    include: {
      placements: {
        where: { status: 'ACTIVE' },
        include: { resident: true },
      },
      spots: {
        where: { status: 'AVAILABLE', type: { not: 'ROOM' } },
      },
    },
    orderBy: { code: 'asc' },
  })

  const residentProfile = toResidentProfile(resident)

  const results = units
    .filter(unit => unit.spots.length > 0)
    .map(unit => {
      const currentResidents = unit.placements.map(p => p.resident)
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
        conflicts: fit.conflicts.map(c => ({ severity: c.severity, message: c.message })),
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
    .filter(r => !r.conflicts.some(c => c.severity === 'BLOCKING'))
    .sort((a, b) => b.fitScore - a.fitScore)

  return (
    <div>
      <div className="mb-6">
        <Link href="/portal" className="text-sm text-ui-muted hover:text-aoz-primary min-h-[44px] inline-flex items-center">
          {PORTAL_LABELS.form.back}
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-ui-text mt-2">{PORTAL_LABELS.pages.housing}</h1>
        <p className="text-ui-muted mt-1">{PORTAL_LABELS.pages.housingSubtitle}</p>
      </div>

      <PortalHousingBrowse results={results} />
    </div>
  )
}
