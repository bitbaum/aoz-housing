import { db, householdTask, taskAttentionFlag } from '@/lib/db'
import { eq, and } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { getPortalAuth } from '@/lib/portal-auth'
import { portalAttentionFlagSchema } from '@/lib/validation/schemas'
import { logger } from '@/lib/logger'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getPortalAuth()
  if (!auth) {
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.NOT_AUTHENTICATED },
      { status: 401 },
    )
  }

  const { id } = await params

  let message: string | undefined
  try {
    const contentType = request.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const body = await request.json()
      const parsed = portalAttentionFlagSchema.safeParse(body)
      if (parsed.success) {
        message = parsed.data.message
      }
    }
  } catch {
    // Empty body is fine
  }

  try {
    const task = await db.query.householdTask.findFirst({
      where: and(
        eq(householdTask.id, id),
        eq(householdTask.housingUnitId, auth.placement.housingUnitId),
      ),
    })

    if (!task) {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.TASK_NOT_FOUND },
        { status: 404 },
      )
    }

    if (task.isCompleted) {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.TASK_ALREADY_COMPLETED },
        { status: 400 },
      )
    }

    const [flag] = await db
      .insert(taskAttentionFlag)
      .values({
        taskId: id,
        flaggedById: auth.resident.id,
        message: message || null,
      })
      .returning()

    // Update task status to NEEDS_ATTENTION
    await db
      .update(householdTask)
      .set({ currentStatus: 'NEEDS_ATTENTION' })
      .where(eq(householdTask.id, id))

    return NextResponse.json({ success: true, data: flag })
  } catch (error) {
    logger.errorWithCause('Failed to flag household task', error)
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.TASK_FLAG_ERROR },
      { status: 500 },
    )
  }
}
