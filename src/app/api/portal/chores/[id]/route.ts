import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getPortalAuth } from '@/lib/portal-auth'
import { logger } from '@/lib/logger'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'
import { QUERY_LIMITS } from '@/lib/config/thresholds'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getPortalAuth()
  if (!auth) {
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.NOT_AUTHENTICATED },
      { status: 401 },
    )
  }

  const { id } = await params

  try {
    const task = await prisma.householdTask.findFirst({
      where: {
        id,
        housingUnitId: auth.placement.housingUnitId,
      },
      include: {
        createdByResident: { select: { id: true, code: true } },
        completions: {
          orderBy: { completedAt: 'desc' },
          take: QUERY_LIMITS.choreHistory,
          include: { completedBy: { select: { id: true, code: true } } },
        },
        attentionFlags: {
          orderBy: { createdAt: 'desc' },
          include: { flaggedBy: { select: { id: true, code: true } } },
        },
        requests: {
          orderBy: { createdAt: 'desc' },
          include: {
            requestedBy: { select: { id: true, code: true } },
            requestedResident: { select: { id: true, code: true } },
          },
        },
      },
    })

    if (!task) {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.TASK_NOT_FOUND },
        { status: 404 },
      )
    }

    // Get roommates for request form
    const roommates = await prisma.placement.findMany({
      where: {
        housingUnitId: auth.placement.housingUnitId,
        status: 'ACTIVE',
        residentId: { not: auth.resident.id },
      },
      select: {
        resident: { select: { id: true, code: true } },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        task,
        roommates: roommates.map((p) => p.resident),
        currentResidentId: auth.resident.id,
      },
    })
  } catch (error) {
    logger.errorWithCause('Failed to get household task detail', error)
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.TASK_LOAD_ERROR },
      { status: 500 },
    )
  }
}
