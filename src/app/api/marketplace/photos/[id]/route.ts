import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { getPortalAuth } from '@/lib/portal-auth'
import { logger } from '@/lib/logger'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'

/**
 * Serve one marketplace listing photo.
 *
 * Marketplace posts are visible across units by design (browsing "other
 * units"), so any signed-in staff or resident may view a photo — except once
 * staff has hidden the post, where only staff may still see it. 404 rather
 * than 403 either way, matching the resident-photo route: no existence leak.
 */
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const staff = await getCurrentUser()
  const resident = staff ? null : await getPortalAuth()

  if (!staff && !resident) {
    return NextResponse.json({ success: false, error: ERROR_MESSAGES.NOT_AUTHENTICATED }, { status: 401 })
  }

  try {
    const photo = await prisma.marketplacePostPhoto.findUnique({
      where: { id: params.id },
      include: { post: { select: { hiddenByStaff: true } } },
    })
    if (!photo || (!staff && photo.post.hiddenByStaff)) {
      return NextResponse.json({ success: false, error: ERROR_MESSAGES.SAVE_ERROR }, { status: 404 })
    }

    return new NextResponse(new Uint8Array(photo.data), {
      headers: {
        'Content-Type': photo.mimeType,
        'X-Content-Type-Options': 'nosniff',
        'Content-Disposition': 'inline',
        'Cache-Control': 'private, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    logger.errorWithCause('Failed to serve marketplace photo', error)
    return NextResponse.json({ success: false, error: ERROR_MESSAGES.SESSION_ERROR }, { status: 500 })
  }
}
