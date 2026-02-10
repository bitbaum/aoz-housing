/**
 * Shared portal authentication helper
 *
 * Extracts the repeated pattern of reading resident_code cookie,
 * finding the resident, and getting their active placement.
 *
 * DRY: Used by all portal API routes and server components.
 */

import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'

export interface PortalAuthResult {
  resident: {
    id: string
    code: string
  }
  placement: {
    id: string
    housingUnitId: string
  }
}

/**
 * Authenticate portal request and return resident + active placement.
 * Returns null if not authenticated or no active placement.
 */
export async function getPortalAuth(): Promise<PortalAuthResult | null> {
  const cookieStore = await cookies()
  const residentCode = cookieStore.get('resident_code')?.value

  if (!residentCode) return null

  const resident = await prisma.resident.findUnique({
    where: { code: residentCode },
    select: {
      id: true,
      code: true,
      placements: {
        where: { status: 'ACTIVE' },
        select: { id: true, housingUnitId: true },
        take: 1,
      },
    },
  })

  if (!resident) return null

  const placement = resident.placements[0]
  if (!placement) return null

  return {
    resident: { id: resident.id, code: resident.code },
    placement: { id: placement.id, housingUnitId: placement.housingUnitId },
  }
}
