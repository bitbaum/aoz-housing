import {
  db,
  resident as residentTable,
  placement as placementTable,
  satisfactionCheckIn,
  incident,
} from '@/lib/db'
import { desc, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { portalSatisfactionSchema } from '@/lib/validation/schemas'
import { logger } from '@/lib/logger'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'
import { notifyStaff, lowSatisfactionAlert } from '@/lib/email'
import { getResidentCookie } from '@/lib/portal-auth'
import { weeksBetween } from '@/lib/utils'

export async function POST(request: NextRequest) {
  const residentCode = await getResidentCookie()

  if (!residentCode) {
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.NOT_AUTHENTICATED },
      { status: 401 },
    )
  }

  const body = await request.json()
  const parsed = portalSatisfactionSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.INVALID_RATING },
      { status: 400 },
    )
  }

  const { rating, concerns } = parsed.data

  // Find resident and their active placement
  const resident = await db.query.resident.findFirst({
    where: eq(residentTable.code, residentCode),
    with: {
      placements: {
        where: eq(placementTable.status, 'ACTIVE'),
        limit: 1,
        with: { housingUnit: { columns: { code: true } } },
      },
    },
  })

  if (!resident) {
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.RESIDENT_NOT_FOUND },
      { status: 404 },
    )
  }

  const placement = resident.placements[0]
  if (!placement) {
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.NO_ACTIVE_PLACEMENT },
      { status: 400 },
    )
  }

  try {
    const weeksSinceStart = weeksBetween(placement.startDate)

    // Wrap all DB writes in a transaction
    await db.transaction(async (tx) => {
      await tx.insert(satisfactionCheckIn).values({
        placementId: placement.id,
        checkInType: 'AD_HOC',
        weekNumber: weeksSinceStart,
        overallSatisfaction: rating,
        roommateRelations: null,
        facilitySatisfaction: null,
        safetyFeeling: null,
        concerns: concerns || null,
        improvements: null,
        positives: null,
        collectedBy: null,
        isAnonymous: true,
      })

      await tx
        .update(placementTable)
        .set({
          satisfactionRating: rating,
        })
        .where(eq(placementTable.id, placement.id))

      // Create alert for staff if low rating
      if (rating <= 2) {
        await tx.insert(incident).values({
          housingUnitId: placement.housingUnitId,
          reportedById: resident.id,
          date: new Date(),
          category: 'WELLBEING',
          type: 'LOW_SATISFACTION',
          severity: rating === 1 ? 'HIGH' : 'MEDIUM',
          description: concerns
            ? `Bewohner hat niedrige Zufriedenheit gemeldet: "${concerns}"`
            : 'Bewohner hat niedrige Zufriedenheit im Portal gemeldet (keine Details angegeben)',
        })
      }
    })

    // Fire-and-forget email notification for low satisfaction
    if (rating <= 2) {
      const email = lowSatisfactionAlert({
        residentCode: resident.code,
        housingUnitCode: placement.housingUnit.code,
        overallSatisfaction: rating,
        concerns,
      })
      notifyStaff(email.subject, email.html).catch(() => {
        // Silently ignore — incident already created in DB
      })
    }

    return NextResponse.json({ success: true, rating })
  } catch (error) {
    logger.errorWithCause('Failed to save satisfaction rating', error)
    return NextResponse.json({ success: false, error: ERROR_MESSAGES.SAVE_FAILED }, { status: 500 })
  }
}

// GET - Get the last check-in date for the resident
export async function GET() {
  const residentCode = await getResidentCookie()

  if (!residentCode) {
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.NOT_AUTHENTICATED },
      { status: 401 },
    )
  }

  const resident = await db.query.resident.findFirst({
    where: eq(residentTable.code, residentCode),
    with: {
      placements: {
        where: eq(placementTable.status, 'ACTIVE'),
        limit: 1,
        with: {
          checkIns: {
            orderBy: [desc(satisfactionCheckIn.createdAt)],
            limit: 1,
          },
        },
      },
    },
  })

  if (!resident || !resident.placements[0]) {
    return NextResponse.json({ lastCheckIn: null, rating: null })
  }

  const placement = resident.placements[0]
  const lastCheckIn = placement.checkIns[0]

  return NextResponse.json({
    lastCheckIn: lastCheckIn?.createdAt || null,
    rating: placement.satisfactionRating,
  })
}
