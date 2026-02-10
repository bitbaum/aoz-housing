import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getPortalAuth } from '@/lib/portal-auth'
import { portalCreateTaskSchema, ValidationError, validateFormData } from '@/lib/validation/schemas'
import { logAudit } from '@/lib/audit'
import { logger } from '@/lib/logger'

export async function GET() {
  const auth = await getPortalAuth()
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Nicht angemeldet' }, { status: 401 })
  }

  try {
    const tasks = await prisma.householdTask.findMany({
      where: { housingUnitId: auth.placement.housingUnitId },
      include: {
        completions: {
          orderBy: { completedAt: 'desc' },
          take: 1,
          include: { completedBy: { select: { id: true, code: true } } },
        },
        attentionFlags: {
          where: { isResolved: false },
        },
        requests: {
          where: { status: { in: ['PENDING', 'ACCEPTED'] } },
        },
        createdByResident: { select: { id: true, code: true } },
      },
      orderBy: [
        { currentStatus: 'desc' },
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    // Fairness data: completion counts per resident
    const completionCounts = await prisma.taskCompletion.groupBy({
      by: ['completedById'],
      where: {
        task: { housingUnitId: auth.placement.housingUnitId },
      },
      _count: { id: true },
    })

    // Get roommate names for the fairness display
    const roommates = await prisma.placement.findMany({
      where: {
        housingUnitId: auth.placement.housingUnitId,
        status: 'ACTIVE',
      },
      select: {
        resident: { select: { id: true, code: true } },
      },
    })

    const fairness = roommates.map(p => ({
      residentId: p.resident.id,
      code: p.resident.code,
      completions: completionCounts.find(c => c.completedById === p.resident.id)?._count.id || 0,
    }))

    return NextResponse.json({ success: true, data: { tasks, fairness } })
  } catch (error) {
    logger.errorWithCause('Failed to list household tasks', error)
    return NextResponse.json({ success: false, error: 'Aufgaben konnten nicht geladen werden' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await getPortalAuth()
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Nicht angemeldet' }, { status: 401 })
  }

  let data: ReturnType<typeof validateFormData<typeof portalCreateTaskSchema>>
  try {
    const formData = await request.formData()
    data = validateFormData(portalCreateTaskSchema, formData)
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ success: false, error: err.message }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: 'Ungültige Eingabe' }, { status: 400 })
  }

  try {
    const task = await prisma.householdTask.create({
      data: {
        housingUnitId: auth.placement.housingUnitId,
        createdByResidentId: auth.resident.id,
        title: data.title,
        description: data.description || null,
        instructions: data.instructions || null,
        taskType: data.taskType,
        category: data.category,
        priority: data.priority,
        scheduleHuman: data.scheduleHuman || null,
        estimatedMinutes: data.estimatedMinutes || null,
      },
    })

    await logAudit({
      action: 'CREATE',
      entity: 'HOUSEHOLD_TASK',
      entityId: task.id,
      changes: { title: data.title, category: data.category, createdBy: auth.resident.code },
    })

    return NextResponse.json({ success: true, data: task })
  } catch (error) {
    logger.errorWithCause('Failed to create household task', error)
    return NextResponse.json({ success: false, error: 'Aufgabe konnte nicht erstellt werden' }, { status: 500 })
  }
}
