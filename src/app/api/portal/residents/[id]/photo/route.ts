import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getPortalResident } from '@/lib/portal-auth'
import { logger } from '@/lib/logger'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'

/**
 * Serve a resident's avatar photo to themselves and their current roommates.
 * Anyone else — including residents of other units — gets a 404, so the
 * route leaks neither the photo nor whether one exists.
 */
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const viewer = await getPortalResident()
  if (!viewer) {
    return NextResponse.json({ success: false, error: ERROR_MESSAGES.NOT_AUTHENTICATED }, { status: 401 })
  }

  try {
    if (viewer.id !== params.id) {
      const sharedUnit = await prisma.placement.findFirst({
        where: {
          residentId: viewer.id,
          status: 'ACTIVE',
          housingUnit: {
            placements: { some: { residentId: params.id, status: 'ACTIVE' } },
          },
        },
        select: { id: true },
      })
      if (!sharedUnit) {
        return NextResponse.json({ success: false, error: ERROR_MESSAGES.RESIDENT_NOT_FOUND }, { status: 404 })
      }
    }

    const photo = await prisma.residentPhoto.findUnique({ where: { residentId: params.id } })
    if (!photo) {
      return NextResponse.json({ success: false, error: ERROR_MESSAGES.RESIDENT_NOT_FOUND }, { status: 404 })
    }

    return new NextResponse(new Uint8Array(photo.data), {
      headers: {
        'Content-Type': photo.mimeType,
        'X-Content-Type-Options': 'nosniff',
        'Content-Disposition': 'inline',
        // Immutable per version: the <img> URL carries ?v=<updatedAt>.
        'Cache-Control': 'private, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    logger.errorWithCause('Failed to serve resident photo', error)
    return NextResponse.json({ success: false, error: ERROR_MESSAGES.SESSION_ERROR }, { status: 500 })
  }
}
