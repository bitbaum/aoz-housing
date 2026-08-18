/**
 * Session — a signed JWT in an httpOnly cookie. Stateless, in-house,
 * one cookie for everyone; the role tier inside the token decides what
 * the middleware and the admin guards allow (evig's Users → Staff → Admin).
 */
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import type { CustomerRole } from '@/config/database'

export const SESSION_COOKIE = 'fitfoot_session'
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14 // 14 days

export interface SessionPayload {
  sub: string // customer id
  email: string
  role: CustomerRole
}

function secretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET is not set')
  return new TextEncoder().encode(secret)
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ email: payload.email, role: payload.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setIssuer('fitfoot')
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secretKey())
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), { issuer: 'fitfoot' })
    if (!payload.sub || typeof payload.email !== 'string' || typeof payload.role !== 'string') {
      return null
    }
    return { sub: payload.sub, email: payload.email, role: payload.role as SessionPayload['role'] }
  } catch {
    return null
  }
}

export async function setSessionCookie(payload: SessionPayload): Promise<void> {
  const token = await createSessionToken(payload)
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_TTL_SECONDS,
    path: '/',
  })
}

export function clearSessionCookie(): void {
  cookies().delete(SESSION_COOKIE)
}

export async function readSession(): Promise<SessionPayload | null> {
  const token = cookies().get(SESSION_COOKIE)?.value
  if (!token) return null
  return verifySessionToken(token)
}
