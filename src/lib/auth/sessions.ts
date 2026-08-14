/**
 * Turning account identities into sessions — SSOT for "you are now signed in".
 *
 * Shared by /api/auth/login and /api/auth/signup so claiming a code and
 * logging in can never drift on which cookies they set.
 */

import { setSessionCookie } from '@/lib/auth'
import { setResidentCookie } from '@/lib/portal-auth'
import type { AccountIdentities } from '@/lib/auth/account'

export interface SessionResult {
  success: true
  /** Where to land: staff wins, because the admin side is the bigger surface. */
  type: 'staff' | 'resident'
  /** Every role this login carries — the nav offers a switch when there are two. */
  roles: Array<'staff' | 'resident'>
}

export async function establishSessions(
  identities: AccountIdentities
): Promise<SessionResult> {
  if (identities.staff) {
    const { id, email, name, role } = identities.staff
    await setSessionCookie({ id, email, name, role })
  }
  if (identities.resident) {
    await setResidentCookie(identities.resident.code)
  }

  const roles: Array<'staff' | 'resident'> = []
  if (identities.staff) roles.push('staff')
  if (identities.resident) roles.push('resident')

  return { success: true, type: identities.staff ? 'staff' : 'resident', roles }
}
