import { NextResponse } from 'next/server'
import { clearSessionCookie } from '@/lib/auth'
import { logger } from '@/lib/logger'

export async function POST() {
  try {
    // Clear both staff and resident cookies on logout
    await clearSessionCookie(true)
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.errorWithCause('Logout failed', error)
    return NextResponse.json(
      { success: false, error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}
