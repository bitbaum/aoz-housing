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
  const { rating } = body

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
