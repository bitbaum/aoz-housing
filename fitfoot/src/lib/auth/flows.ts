/**
 * Auth flows — register / login against OUR customers table.
 * Login failure is ONE generic message; anything specific is an
 * enumeration oracle.
 */
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { customers } from '@/db/schema'
import { hashPassword, verifyPassword } from './passwords'
import type { CustomerRole } from '@/config/database'

export const GENERIC_LOGIN_ERROR = 'Incorrect email or password.'

export class FlowError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message)
  }
}

export interface AuthedCustomer {
  id: string
  email: string
  role: CustomerRole
  firstName: string
  lastName: string
}

export async function registerCustomer(input: {
  email: string
  password: string
  firstName: string
  lastName: string
}): Promise<AuthedCustomer> {
  const [existing] = await db
    .select()
    .from(customers)
    .where(eq(customers.email, input.email))
    .limit(1)

  if (existing?.passwordHash) {
    throw new FlowError(409, 'An account already exists for this email.')
  }

  const passwordHash = await hashPassword(input.password)

  if (existing) {
    // Guest-checkout record claiming its account: keep the order history.
    const [updated] = await db
      .update(customers)
      .set({
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        lastLoginAt: new Date(),
      })
      .where(eq(customers.id, existing.id))
      .returning()
    return toAuthed(updated)
  }

  const [created] = await db
    .insert(customers)
    .values({
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      lastLoginAt: new Date(),
    })
    .returning()
  return toAuthed(created)
}

export async function loginCustomer(input: {
  email: string
  password: string
}): Promise<AuthedCustomer> {
  const [row] = await db.select().from(customers).where(eq(customers.email, input.email)).limit(1)

  if (!row?.passwordHash || !row.active) {
    throw new FlowError(401, GENERIC_LOGIN_ERROR)
  }
  const ok = await verifyPassword(input.password, row.passwordHash)
  if (!ok) {
    throw new FlowError(401, GENERIC_LOGIN_ERROR)
  }

  await db.update(customers).set({ lastLoginAt: new Date() }).where(eq(customers.id, row.id))
  return toAuthed(row)
}

function toAuthed(row: typeof customers.$inferSelect): AuthedCustomer {
  return {
    id: row.id,
    email: row.email,
    role: row.role as CustomerRole,
    firstName: row.firstName,
    lastName: row.lastName,
  }
}
