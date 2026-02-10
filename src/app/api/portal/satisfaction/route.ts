import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { portalSatisfactionSchema } from '@/lib/validation/schemas'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const residentCode = cookieStore.get('resident_code')?.value

  if (!residentCode) {
    return NextResponse.json({ success: false, error: 'Nicht angemeldet' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = portalSatisfactionSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Ungültige Bewertung' }, { status: 400 })
  }

  const { rating, concerns } = parsed.data

  // Find resident and their active placement
  const resident = await prisma.resident.findUnique({
    where: { code: residentCode },
    include: {
      placements: {
        where: { status: 'ACTIVE' },
        take: 1,
      },
    },
  })

  if (!resident) {
    return NextResponse.json({ success: false, error: 'Bewohner nicht gefunden' }, { status: 404 })
  }

  const placement = resident.placements[0]
  if (!placement) {
    return NextResponse.json({ success: false, error: 'Keine aktive Platzierung' }, { status: 400 })
  }

  try {
    const weeksSinceStart = Math.floor(
      (Date.now() - new Date(placement.startDate).getTime()) / (7 * 24 * 60 * 60 * 1000)
    )

    // Wrap all DB writes in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.satisfactionCheckIn.create({
        data: {
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
        },
      })

      await tx.placement.update({
        where: { id: placement.id },
        data: {
          satisfactionRating: rating,
        },
      })

      // Create alert for staff if low rating
      if (rating <= 2) {
        await tx.incident.create({
          data: {
            housingUnitId: placement.housingUnitId,
            reportedById: resident.id,
            date: new Date(),
            category: 'WELLBEING',
            type: 'LOW_SATISFACTION',
            severity: rating === 1 ? 'HIGH' : 'MEDIUM',
            description: concerns
              ? `Bewohner hat niedrige Zufriedenheit gemeldet: "${concerns}"`
              : 'Bewohner hat niedrige Zufriedenheit im Portal gemeldet (keine Details angegeben)',
          },
        })
      }
    })

    return NextResponse.json({ success: true, rating })
  } catch (error) {
    logger.errorWithCause('Failed to save satisfaction rating', error)
    return NextResponse.json({ success: false, error: 'Speichern fehlgeschlagen' }, { status: 500 })
  }
}

// GET - Get the last check-in date for the resident
export async function GET() {
  const cookieStore = await cookies()
  const residentCode = cookieStore.get('resident_code')?.value

  if (!residentCode) {
    return NextResponse.json({ success: false, error: 'Nicht angemeldet' }, { status: 401 })
  }

  const resident = await prisma.resident.findUnique({
    where: { code: residentCode },
    include: {
      placements: {
        where: { status: 'ACTIVE' },
        take: 1,
        include: {
          checkIns: {
            orderBy: { createdAt: 'desc' },
            take: 1,
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
