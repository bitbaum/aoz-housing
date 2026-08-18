/**
 * Auth guards — evig's three tiers, zero ambiguity:
 * CUSTOMER → STAFF → ADMIN. Staff routes re-check the database on every
 * request so a deactivated account dies immediately, token or no token.
 */
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { customers } from '@/db/schema'
import { readSession, type SessionPayload } from './session'
import type { CustomerRole } from '@/config/database'

export class AuthError extends Error {
  constructor(
    public readonly status: 401 | 403,
    message: string
  ) {
    super(message)
  }
}

const ROLE_RANK: Record<CustomerRole, number> = { CUSTOMER: 0, STAFF: 1, ADMIN: 2 }

export function roleAtLeast(role: CustomerRole, min: CustomerRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[min]
}

/** Session only — for customer-facing pages (no DB hit). */
export async function getSession(): Promise<SessionPayload | null> {
  return readSession()
}

/** Require a signed-in, still-active account; returns the fresh DB row. */
export async function requireCustomer() {
  const session = await readSession()
  if (!session) throw new AuthError(401, 'Not signed in')
  const [row] = await db.select().from(customers).where(eq(customers.id, session.sub)).limit(1)
  if (!row || !row.active) throw new AuthError(401, 'Account inactive')
  return row
}

/** Require STAFF or ADMIN — the gate on every CRM surface. */
export async function requireStaff() {
  const row = await requireCustomer()
  if (!roleAtLeast(row.role as CustomerRole, 'STAFF')) {
    throw new AuthError(403, 'Staff access required')
  }
  return row
}

/** Require ADMIN — destructive or account-management actions. */
export async function requireAdmin() {
  const row = await requireCustomer()
  if (!roleAtLeast(row.role as CustomerRole, 'ADMIN')) {
    throw new AuthError(403, 'Admin access required')
  }
  return row
}
