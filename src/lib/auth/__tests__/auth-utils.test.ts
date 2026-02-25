/**
 * Tests for JWT token management (jwt.ts) and password hashing (password.ts).
 *
 * Integration-style: uses real jose (via createToken/verifyToken) and real
 * bcryptjs -- no mocking of crypto libraries.
 *
 * For edge-case JWT tests (wrong secret, wrong issuer, missing fields, expired),
 * we build JWTs manually with Node's crypto module so we don't need to import
 * the ESM-only jose package directly in the test runner.
 */

import crypto from 'crypto'
import { createToken, verifyToken, shouldRefreshToken, refreshToken, type TokenPayload } from '@/lib/auth/jwt'
import { hashPassword, verifyPassword } from '@/lib/auth/password'
import { AUTH_CONFIG } from '@/lib/auth/config'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SAMPLE_PAYLOAD = {
  sub: 'user-123',
  email: 'test@aoz.ch',
  name: 'Test User',
  role: 'ADMIN' as const,
}

/** Base64url encode a buffer or string. */
function b64url(input: string | Buffer): string {
  const buf = typeof input === 'string' ? Buffer.from(input) : input
  return buf.toString('base64url')
}

/** Decode a JWT payload (middle segment) without verification. */
function unsafeDecode(token: string): Record<string, unknown> {
  const [, payloadB64] = token.split('.')
  return JSON.parse(Buffer.from(payloadB64, 'base64url').toString())
}

/**
 * Build a HS256-signed JWT from scratch using Node crypto.
 * Useful for crafting tokens with intentionally wrong secrets, issuers, or
 * missing fields -- without importing jose (ESM-only) in the Jest runner.
 */
function buildRawJwt(
  claims: Record<string, unknown>,
  secret: string,
): string {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = b64url(JSON.stringify(claims))
  const sigInput = `${header}.${payload}`
  const signature = b64url(
    crypto.createHmac('sha256', secret).update(sigInput).digest(),
  )
  return `${sigInput}.${signature}`
}

// ---------------------------------------------------------------------------
// JWT Token Management
// ---------------------------------------------------------------------------

describe('JWT Token Management', () => {
  // ----- createToken -----
  describe('createToken', () => {
    it('returns a three-part JWT string', async () => {
      const token = await createToken(SAMPLE_PAYLOAD)
      expect(token.split('.')).toHaveLength(3)
    })

    it('embeds the provided payload fields', async () => {
      const token = await createToken(SAMPLE_PAYLOAD)
      const decoded = unsafeDecode(token)

      expect(decoded.sub).toBe(SAMPLE_PAYLOAD.sub)
      expect(decoded.email).toBe(SAMPLE_PAYLOAD.email)
      expect(decoded.name).toBe(SAMPLE_PAYLOAD.name)
      expect(decoded.role).toBe(SAMPLE_PAYLOAD.role)
    })

    it('sets issuer to aoz-housing', async () => {
      const token = await createToken(SAMPLE_PAYLOAD)
      const decoded = unsafeDecode(token)

      expect(decoded.iss).toBe('aoz-housing')
    })

    it('sets iat and exp claims with correct duration', async () => {
      const token = await createToken(SAMPLE_PAYLOAD)
      const decoded = unsafeDecode(token)

      expect(typeof decoded.iat).toBe('number')
      expect(typeof decoded.exp).toBe('number')
      expect((decoded.exp as number) - (decoded.iat as number)).toBe(
        AUTH_CONFIG.jwt.expiresIn,
      )
    })

    it('produces a token that verifyToken accepts', async () => {
      const token = await createToken(SAMPLE_PAYLOAD)
      const result = await verifyToken(token)

      expect(result).not.toBeNull()
      expect(result!.sub).toBe(SAMPLE_PAYLOAD.sub)
    })
  })

  // ----- verifyToken -----
  describe('verifyToken', () => {
    it('returns full payload for a valid token', async () => {
      const token = await createToken(SAMPLE_PAYLOAD)
      const payload = await verifyToken(token)

      expect(payload).not.toBeNull()
      expect(payload!.sub).toBe(SAMPLE_PAYLOAD.sub)
      expect(payload!.email).toBe(SAMPLE_PAYLOAD.email)
      expect(payload!.name).toBe(SAMPLE_PAYLOAD.name)
      expect(payload!.role).toBe(SAMPLE_PAYLOAD.role)
      expect(payload!.iss).toBe('aoz-housing')
    })

    it('returns null for a tampered token', async () => {
      const token = await createToken(SAMPLE_PAYLOAD)

      // Flip a character in the signature (third segment)
      const parts = token.split('.')
      const sig = parts[2]
      const flipped = sig[0] === 'A' ? 'B' : 'A'
      parts[2] = flipped + sig.slice(1)

      expect(await verifyToken(parts.join('.'))).toBeNull()
    })

    it('returns null for garbage input', async () => {
      expect(await verifyToken('not.a.jwt')).toBeNull()
      expect(await verifyToken('')).toBeNull()
      expect(await verifyToken('abc123')).toBeNull()
    })

    it('returns null for a token signed with a different secret', async () => {
      const now = Math.floor(Date.now() / 1000)
      const token = buildRawJwt(
        {
          ...SAMPLE_PAYLOAD,
          iss: 'aoz-housing',
          iat: now,
          exp: now + 3600,
        },
        'wrong-secret-key',
      )

      expect(await verifyToken(token)).toBeNull()
    })

    it('returns null for a token with wrong issuer', async () => {
      const now = Math.floor(Date.now() / 1000)
      const token = buildRawJwt(
        {
          ...SAMPLE_PAYLOAD,
          iss: 'wrong-issuer',
          iat: now,
          exp: now + 3600,
        },
        AUTH_CONFIG.jwt.secret,
      )

      expect(await verifyToken(token)).toBeNull()
    })

    it('returns null for an expired token', async () => {
      const now = Math.floor(Date.now() / 1000)
      const token = buildRawJwt(
        {
          ...SAMPLE_PAYLOAD,
          iss: 'aoz-housing',
          iat: now - 7200,
          exp: now - 1, // expired 1 second ago
        },
        AUTH_CONFIG.jwt.secret,
      )

      expect(await verifyToken(token)).toBeNull()
    })

    it('returns null when required field "role" is missing', async () => {
      const now = Math.floor(Date.now() / 1000)
      const token = buildRawJwt(
        {
          sub: 'user-123',
          email: 'test@aoz.ch',
          name: 'Test User',
          // role intentionally omitted
          iss: 'aoz-housing',
          iat: now,
          exp: now + 3600,
        },
        AUTH_CONFIG.jwt.secret,
      )

      expect(await verifyToken(token)).toBeNull()
    })

    it('returns null when required field "email" is missing', async () => {
      const now = Math.floor(Date.now() / 1000)
      const token = buildRawJwt(
        {
          sub: 'user-123',
          name: 'Test User',
          role: 'ADMIN',
          // email intentionally omitted
          iss: 'aoz-housing',
          iat: now,
          exp: now + 3600,
        },
        AUTH_CONFIG.jwt.secret,
      )

      expect(await verifyToken(token)).toBeNull()
    })

    it('accepts empty string email (code-only users)', async () => {
      const token = await createToken({
        sub: 'user-456',
        email: '',
        name: 'Code Only User',
        role: 'ADMIN',
      })

      const payload = await verifyToken(token)
      expect(payload).not.toBeNull()
      expect(payload!.email).toBe('')
    })

    it('returns null when required field "name" is missing', async () => {
      const now = Math.floor(Date.now() / 1000)
      const token = buildRawJwt(
        {
          sub: 'user-123',
          email: 'test@aoz.ch',
          role: 'VIEWER',
          // name intentionally omitted
          iss: 'aoz-housing',
          iat: now,
          exp: now + 3600,
        },
        AUTH_CONFIG.jwt.secret,
      )

      expect(await verifyToken(token)).toBeNull()
    })

    it('returns null when required field "sub" is missing', async () => {
      const now = Math.floor(Date.now() / 1000)
      const token = buildRawJwt(
        {
          email: 'test@aoz.ch',
          name: 'Test User',
          role: 'ADMIN',
          // sub intentionally omitted
          iss: 'aoz-housing',
          iat: now,
          exp: now + 3600,
        },
        AUTH_CONFIG.jwt.secret,
      )

      expect(await verifyToken(token)).toBeNull()
    })
  })

  // ----- shouldRefreshToken -----
  describe('shouldRefreshToken', () => {
    beforeEach(() => jest.useFakeTimers())
    afterEach(() => jest.useRealTimers())

    it('returns false when plenty of time remains', () => {
      const now = Math.floor(Date.now() / 1000)
      const payload = {
        ...SAMPLE_PAYLOAD,
        iat: now,
        iss: 'aoz-housing',
        exp: now + 4 * 3600, // 4 hours remaining
      } as TokenPayload

      expect(shouldRefreshToken(payload)).toBe(false)
    })

    it('returns true when time remaining is below refresh threshold', () => {
      const now = Math.floor(Date.now() / 1000)
      const payload = {
        ...SAMPLE_PAYLOAD,
        iat: now - 7 * 3600,
        iss: 'aoz-housing',
        exp: now + 30 * 60, // 30 min left (threshold is 1 hour)
      } as TokenPayload

      expect(shouldRefreshToken(payload)).toBe(true)
    })

    it('returns true at one second below threshold boundary', () => {
      const now = Math.floor(Date.now() / 1000)
      const payload = {
        ...SAMPLE_PAYLOAD,
        iat: now - 7 * 3600,
        iss: 'aoz-housing',
        exp: now + AUTH_CONFIG.session.refreshThreshold - 1,
      } as TokenPayload

      expect(shouldRefreshToken(payload)).toBe(true)
    })

    it('returns false when remaining time equals threshold exactly', () => {
      const now = Math.floor(Date.now() / 1000)
      const payload = {
        ...SAMPLE_PAYLOAD,
        iat: now - 7 * 3600,
        iss: 'aoz-housing',
        exp: now + AUTH_CONFIG.session.refreshThreshold,
      } as TokenPayload

      // timeRemaining === threshold, NOT less than
      expect(shouldRefreshToken(payload)).toBe(false)
    })

    it('returns false when exp is missing', () => {
      const payload = {
        ...SAMPLE_PAYLOAD,
        iat: Math.floor(Date.now() / 1000),
        iss: 'aoz-housing',
      } as TokenPayload

      expect(shouldRefreshToken(payload)).toBe(false)
    })

    it('returns true after time advances past threshold', () => {
      const now = Math.floor(Date.now() / 1000)
      const payload = {
        ...SAMPLE_PAYLOAD,
        iat: now,
        iss: 'aoz-housing',
        exp: now + AUTH_CONFIG.jwt.expiresIn,
      } as TokenPayload

      // Initially: 8 hours remaining, threshold is 1 hour -- no refresh
      expect(shouldRefreshToken(payload)).toBe(false)

      // Advance to 30 minutes before expiry
      const advanceMs = (AUTH_CONFIG.jwt.expiresIn - 30 * 60) * 1000
      jest.setSystemTime(Date.now() + advanceMs)

      expect(shouldRefreshToken(payload)).toBe(true)
    })
  })

  // ----- refreshToken -----
  describe('refreshToken', () => {
    it('returns a new valid JWT string', async () => {
      const original = await createToken(SAMPLE_PAYLOAD)
      const originalPayload = await verifyToken(original)

      const refreshed = await refreshToken(originalPayload!)
      expect(refreshed.split('.')).toHaveLength(3)
      expect(await verifyToken(refreshed)).not.toBeNull()
    })

    it('preserves sub, email, name, and role from the original', async () => {
      const original = await createToken(SAMPLE_PAYLOAD)
      const originalPayload = await verifyToken(original)

      const refreshed = await refreshToken(originalPayload!)
      const refreshedPayload = await verifyToken(refreshed)

      expect(refreshedPayload).not.toBeNull()
      expect(refreshedPayload!.sub).toBe(SAMPLE_PAYLOAD.sub)
      expect(refreshedPayload!.email).toBe(SAMPLE_PAYLOAD.email)
      expect(refreshedPayload!.name).toBe(SAMPLE_PAYLOAD.name)
      expect(refreshedPayload!.role).toBe(SAMPLE_PAYLOAD.role)
    })

    it('issues a new expiry based on current time', async () => {
      const original = await createToken(SAMPLE_PAYLOAD)
      const originalPayload = await verifyToken(original)

      // Small delay so iat differs
      await new Promise((r) => setTimeout(r, 1100))

      const refreshed = await refreshToken(originalPayload!)
      const refreshedPayload = await verifyToken(refreshed)

      expect(refreshedPayload!.iat).toBeGreaterThanOrEqual(originalPayload!.iat!)
    })

    it('produces a different token string than the original', async () => {
      const original = await createToken(SAMPLE_PAYLOAD)
      const originalPayload = await verifyToken(original)

      await new Promise((r) => setTimeout(r, 1100))

      const refreshed = await refreshToken(originalPayload!)
      expect(refreshed).not.toBe(original)
    })
  })
})

// ---------------------------------------------------------------------------
// Password Hashing
// ---------------------------------------------------------------------------

describe('Password Hashing', () => {
  // ----- hashPassword -----
  describe('hashPassword', () => {
    it('returns a string different from the original password', async () => {
      const password = 'MySecretPassword123!'
      const hash = await hashPassword(password)

      expect(hash).not.toBe(password)
      expect(typeof hash).toBe('string')
    })

    it('produces a valid bcrypt hash format', async () => {
      const hash = await hashPassword('test-password')

      // bcryptjs produces $2a$ hashes; bcrypt may produce $2b$
      expect(hash).toMatch(/^\$2[aby]\$\d{2}\$/)
    })

    it('generates different hashes for the same password (unique salts)', async () => {
      const password = 'SamePassword!'
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)

      expect(hash1).not.toBe(hash2)
    })

    it('generates a hash of expected bcrypt length (60 chars)', async () => {
      const hash = await hashPassword('any-password')
      expect(hash).toHaveLength(60)
    })
  })

  // ----- verifyPassword -----
  describe('verifyPassword', () => {
    it('returns true for the correct password', async () => {
      const password = 'CorrectPassword!'
      const hash = await hashPassword(password)

      expect(await verifyPassword(password, hash)).toBe(true)
    })

    it('returns false for an incorrect password', async () => {
      const hash = await hashPassword('CorrectPassword!')

      expect(await verifyPassword('WrongPassword!', hash)).toBe(false)
    })

    it('returns false for an empty password against a real hash', async () => {
      const hash = await hashPassword('SomePassword')

      expect(await verifyPassword('', hash)).toBe(false)
    })

    it('handles passwords with special characters and unicode', async () => {
      const password = 'P@$$w0rd! mit Umlauten: ae oe ue'
      const hash = await hashPassword(password)

      expect(await verifyPassword(password, hash)).toBe(true)
      expect(await verifyPassword(password + ' ', hash)).toBe(false)
    })
  })
})
