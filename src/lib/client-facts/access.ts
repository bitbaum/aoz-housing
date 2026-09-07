/**
 * Turning "who is asking" into the seats they hold for one particular client.
 *
 * The policy in `policy.ts` is pure and takes seats as data; this is the only
 * place that goes to the database for them. Keeping the split means the rules
 * about who may see a person's insurance are testable without a database, and
 * the query that feeds them has one home rather than one per page.
 */

import { and, eq } from 'drizzle-orm'

import { getCurrentUser } from '@/lib/auth'
import { STAFF_ROLE_CARE_DOMAIN, type CareRoleId } from '@/lib/config/care'
import { careAssignment, db } from '@/lib/db'

export interface StaffViewer {
  userId: string
  /** OWN_DOMAIN or ALL_DOMAINS, read from the row on every request. */
  scope: string
  role: string
}

/**
 * The signed-in staff member, or null.
 *
 * `scope` comes from the user row rather than the JWT, matching the rule the
 * rest of the product follows: privileges in a token go stale, and revoking
 * oversight must take effect on the next request, not at expiry.
 */
export async function staffViewerFor(): Promise<StaffViewer | null> {
  const user = await getCurrentUser()
  if (!user) return null
  return { userId: user.id, scope: user.scope, role: user.role }
}

/** The care seats this staff member holds for this client. */
export async function seatsForClient(staffId: string, residentId: string): Promise<CareRoleId[]> {
  const rows = await db
    .select({ role: careAssignment.role })
    .from(careAssignment)
    .where(and(eq(careAssignment.staffId, staffId), eq(careAssignment.residentId, residentId)))

  return rows.map((row) => row.role)
}

/**
 * The seat a staff member holds by virtue of their ROLE, for the queue query.
 *
 * A queue cannot ask "which seats do I hold for each of 400 clients" per row,
 * so it filters by assignment; this is what says which domain that person's
 * own role corresponds to. Derived from `STAFF_ROLE_CARE_DOMAIN` rather than
 * restated — the bijection between a staff role and a care domain has one
 * definition in this codebase and must keep having one.
 */
export function ownSeat(role: string): CareRoleId | undefined {
  return STAFF_ROLE_CARE_DOMAIN[role as keyof typeof STAFF_ROLE_CARE_DOMAIN]
}
