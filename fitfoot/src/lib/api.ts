/**
 * API route helpers — one place for the error envelope, so every route
 * fails the same way and AuthError maps to the right status.
 */
import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { AuthError } from '@/lib/auth/guards'
import { logger } from '@/lib/logger'

export function jsonError(status: number, message: string): NextResponse {
  return NextResponse.json({ error: message }, { status })
}

export function handleRouteError(error: unknown, route: string): NextResponse {
  if (error instanceof AuthError) {
    return jsonError(error.status, error.message)
  }
  if (error instanceof ZodError) {
    return jsonError(400, error.issues.map((i) => i.message).join('; '))
  }
  logger.error('Unhandled route error', { route, error: String(error) })
  return jsonError(500, 'Something went wrong. Please try again.')
}
