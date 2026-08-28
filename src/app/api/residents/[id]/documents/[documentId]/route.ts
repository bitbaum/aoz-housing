import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { getPortalResident } from '@/lib/portal-auth'
import { hasPermission, isStaffRole } from '@/lib/auth/role-policy'
import { logger } from '@/lib/logger'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'
import { safeDownloadName } from '@/lib/config/documents'

/**
 * Download one career document.
 *
 * Two kinds of reader are allowed, and no third:
 *
 *  - staff holding `documents:read` — the integration roles and Leitung, not
 *    the housing operations role, which has no reason to read a CV;
 *  - the resident the document is about. It is their CV. A product that lets
 *    staff hold a document about someone and gives that person no way to see
 *    it has taken something from them, whatever the intention.
 *
 * Everyone else gets a 404, not a 403, so the route leaks neither the file nor
 * whether one exists — the same rule the photo route follows.
 *
 * Always served as an ATTACHMENT with nosniff. These are user-uploaded bytes;
 * rendering them inline in the app's own origin is how an uploaded file becomes
 * script running as a signed-in caseworker. The upload allowlist already
 * excludes SVG and HTML, and this is the second half of the same defence.
 *
 * NOT listed in STAFF_ROUTES or RESIDENT_ROUTES, and that is deliberate rather
 * than forgotten: those lists gate a path for exactly one audience, and this
 * path has two. Adding it to either would lock the other out. Middleware
 * therefore passes it through and the checks below are the boundary — which is
 * why the first thing this handler does is establish who is asking.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string; documentId: string } }
) {
  const staff = await getCurrentUser()
  const resident = staff ? null : await getPortalResident()

  if (!staff && !resident) {
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.NOT_AUTHENTICATED },
      { status: 401 }
    )
  }

  const notFound = NextResponse.json(
    { success: false, error: ERROR_MESSAGES.RESIDENT_NOT_FOUND },
    { status: 404 }
  )

  try {
    if (staff) {
      if (!isStaffRole(staff.role) || !hasPermission(staff.role, 'documents:read')) {
        return notFound
      }
    } else if (resident!.id !== params.id) {
      // A resident may read their own file and nobody else's. Roommate
      // visibility, which governs photos, has nothing to do with this.
      return notFound
    }

    const document = await prisma.residentDocument.findFirst({
      // Matched on BOTH ids: without the residentId clause a valid document id
      // would serve under any resident's path, and the URL would stop meaning
      // what it says.
      where: { id: params.documentId, residentId: params.id },
      select: { fileName: true, mimeType: true, blob: { select: { data: true } } },
    })

    if (!document?.blob) return notFound

    const asciiName = safeDownloadName(document.fileName)
    const encodedName = encodeURIComponent(document.fileName)

    return new NextResponse(new Uint8Array(document.blob.data), {
      headers: {
        'Content-Type': document.mimeType,
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'; sandbox",
        'Content-Disposition': `attachment; filename="${asciiName}"; filename*=UTF-8''${encodedName}`,
        // Never cached: unlike an avatar these are sensitive, and a shared or
        // disk cache outliving the session is not a trade worth making.
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (error) {
    logger.errorWithCause('Failed to serve resident document', error)
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.SESSION_ERROR },
      { status: 500 }
    )
  }
}
