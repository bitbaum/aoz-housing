import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { logger } from '@/lib/logger'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.NOT_AUTHENTICATED },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })
  } catch (error) {
    logger.errorWithCause('Session check failed', error)
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.SESSION_ERROR },
      { status: 500 }
    )
  }
}
