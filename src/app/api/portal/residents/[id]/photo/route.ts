import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getPortalResident } from '@/lib/portal-auth'
import { getCurrentUser } from '@/lib/auth'
import { logger } from '@/lib/logger'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'
import { canSeeProfile, type ProfileViewer } from '@/lib/privacy/profile-visibility'

/**
 * Serve a resident's avatar photo to whoever is allowed to see it.
 *
 * Who that is now comes from the resident's own `profileVisibility` setting
 * rather than a rule hardcoded here, and from `canSeeProfile()` rather than a
 * second implementation of it — the roommates page has to reach exactly the
 * same verdict, and a photo shown to someone who was told it was private is
 * not a bug anyone finds in review.
 *
 * Everyone refused gets a 404 rather than a 403, so the route leaks neither the
 * photo nor whether one exists.
 */
export async function GET(_request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const staff = await getCurrentUser()
  const resident = staff ? null : await getPortalResident()

  if (!staff && !resident) {
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.NOT_AUTHENTICATED },
      { status: 401 },
    )
  }

  try {
    const subject = await prisma.resident.findUnique({
      where: { id: params.id },
      select: { id: true, profileVisibility: true },
    })
    if (!subject) {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.RESIDENT_NOT_FOUND },
        { status: 404 },
      )
    }

    let viewer: ProfileViewer
    if (staff) {
      viewer = { kind: 'staff' }
    } else {
      // Only asked when it can change the answer: a resident looking at their
      // own photo, or a PRIVATE subject, needs no unit lookup.
      const sharesUnit =
        resident!.id === params.id
          ? false
          : Boolean(
              await prisma.placement.findFirst({
                where: {
                  residentId: resident!.id,
                  status: 'ACTIVE',
                  housingUnit: {
                    placements: { some: { residentId: params.id, status: 'ACTIVE' } },
                  },
                },
                select: { id: true },
              }),
            )
      viewer = { kind: 'resident', residentId: resident!.id, sharesUnit }
    }

    if (!canSeeProfile(viewer, subject)) {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.RESIDENT_NOT_FOUND },
        { status: 404 },
      )
    }

    const photo = await prisma.residentPhoto.findUnique({ where: { residentId: params.id } })
    if (!photo) {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.RESIDENT_NOT_FOUND },
        { status: 404 },
      )
    }

    return new NextResponse(new Uint8Array(photo.data), {
      headers: {
        'Content-Type': photo.mimeType,
        'X-Content-Type-Options': 'nosniff',
        'Content-Disposition': 'inline',
        // Immutable per version: the <img> URL carries ?v=<updatedAt>.
        // `private` keeps it out of shared caches, which matters more now that
        // staff can fetch photos too.
        'Cache-Control': 'private, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    logger.errorWithCause('Failed to serve resident photo', error)
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.SESSION_ERROR },
      { status: 500 },
    )
  }
}
