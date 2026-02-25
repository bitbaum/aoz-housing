/**
 * JWT Token Management
 *
 * Uses jose library for Edge Runtime compatibility.
 * Stateless tokens with sliding session refresh.
 */

import { SignJWT, jwtVerify, type JWTPayload } from 'jose'
import { AUTH_CONFIG } from './config'

export interface TokenPayload extends JWTPayload {
  sub: string // User ID
  email: string
  name: string
  role: 'ADMIN'
}

/**
 * Create a signed JWT token
 */
export async function createToken(payload: Omit<TokenPayload, 'iat' | 'exp' | 'iss'>): Promise<string> {
  const secret = new TextEncoder().encode(AUTH_CONFIG.jwt.secret)

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: AUTH_CONFIG.jwt.algorithm })
    .setIssuedAt()
    .setIssuer(AUTH_CONFIG.jwt.issuer)
    .setExpirationTime(`${AUTH_CONFIG.jwt.expiresIn}s`)
    .sign(secret)

  return token
}

/**
 * Verify and decode a JWT token
 * Returns null if invalid or expired
 */
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const secret = new TextEncoder().encode(AUTH_CONFIG.jwt.secret)

    const { payload } = await jwtVerify(token, secret, {
      issuer: AUTH_CONFIG.jwt.issuer,
    })

    // Validate required fields (email may be empty string for code-only users)
    if (!payload.sub || typeof payload.email !== 'string' || !payload.name || !payload.role) {
      return null
    }

    return payload as TokenPayload
  } catch {
    // Token invalid, expired, or tampered
    return null
  }
}

/**
 * Check if token should be refreshed (within threshold of expiry)
 */
export function shouldRefreshToken(payload: TokenPayload): boolean {
  if (!payload.exp) return false

  const now = Math.floor(Date.now() / 1000)
  const timeRemaining = payload.exp - now

  return timeRemaining < AUTH_CONFIG.session.refreshThreshold
}

/**
 * Refresh a token (create new token with same payload, new expiry)
 */
export async function refreshToken(payload: TokenPayload): Promise<string> {
  return createToken({
    sub: payload.sub,
    email: payload.email,
    name: payload.name,
    role: payload.role,
  })
}
