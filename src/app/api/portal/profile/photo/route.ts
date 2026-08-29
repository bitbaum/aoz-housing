import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getPortalResident } from '@/lib/portal-auth'
import { PHOTO_LIMITS, isAllowedPhotoMimeType } from '@/lib/config/profile'
import { logAudit } from '@/lib/audit'
import { logger } from '@/lib/logger'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'

export async function POST(request: NextRequest) {
  const resident = await getPortalResident()
  if (!resident) {
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.NOT_AUTHENTICATED },
      { status: 401 },
    )
  }

  try {
    const formData = await request.formData().catch(() => null)
    const file = formData?.get('photo')
    if (!(file instanceof Blob)) {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.INVALID_INPUT },
        { status: 400 },
      )
    }

    if (!isAllowedPhotoMimeType(file.type)) {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.PHOTO_TYPE_INVALID },
        { status: 400 },
      )
    }
    if (file.size === 0 || file.size > PHOTO_LIMITS.maxBytes) {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.PHOTO_TOO_LARGE },
        { status: 400 },
      )
    }

    const data = Buffer.from(await file.arrayBuffer())

    await prisma.residentPhoto.upsert({
      where: { residentId: resident.id },
      update: { data, mimeType: file.type },
      create: { residentId: resident.id, data, mimeType: file.type },
    })

    await logAudit({
      action: 'UPDATE',
      entity: 'RESIDENT_PROFILE',
      entityId: resident.id,
      changes: { photo: 'uploaded', bytes: file.size, by: resident.code },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.errorWithCause('Failed to upload resident photo', error)
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.PHOTO_UPLOAD_ERROR },
      { status: 500 },
    )
  }
}

export async function DELETE() {
  const resident = await getPortalResident()
  if (!resident) {
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.NOT_AUTHENTICATED },
      { status: 401 },
    )
  }

  try {
    await prisma.residentPhoto.deleteMany({ where: { residentId: resident.id } })

    await logAudit({
      action: 'UPDATE',
      entity: 'RESIDENT_PROFILE',
      entityId: resident.id,
      changes: { photo: 'removed', by: resident.code },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.errorWithCause('Failed to delete resident photo', error)
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.PHOTO_DELETE_ERROR },
      { status: 500 },
    )
  }
}
