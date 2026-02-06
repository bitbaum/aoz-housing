import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const residentCode = cookieStore.get('resident_code')?.value

  if (!residentCode) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = await request.json()
  const { rating, concerns } = body

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Invalid rating' }, { status: 400 })
  }

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
    return NextResponse.json({ error: 'Resident not found' }, { status: 404 })
  }

  const placement = resident.placements[0]
  if (!placement) {
    return NextResponse.json({ error: 'No active placement' }, { status: 400 })
  }

  try {
    // Calculate week number since placement start
    const weeksSinceStart = Math.floor(
      (Date.now() - new Date(placement.startDate).getTime()) / (7 * 24 * 60 * 60 * 1000)
    )

    // Create a satisfaction check-in record
    await prisma.satisfactionCheckIn.create({
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
        isAnonymous: true, // Portal check-ins are anonymous
      },
    })

    // Update the placement's satisfaction rating
    await prisma.placement.update({
      where: { id: placement.id },
      data: {
        satisfactionRating: rating,
      },
    })

    return NextResponse.json({ success: true, rating })
  } catch (error) {
    console.error('Failed to save satisfaction rating:', error)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}

// GET - Get the last check-in date for the resident
export async function GET() {
  const cookieStore = await cookies()
  const residentCode = cookieStore.get('resident_code')?.value

  if (!residentCode) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
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
