/**
 * A permission denial has to be explainable to the person it happened to.
 *
 * The access-denied page names the permission in plain German and lists the
 * roles that hold it. Both must stay true automatically: an unnamed permission
 * would print an internal token like `placements:write` at a caseworker, and a
 * hand-listed role would go stale the first time the policy changed.
 */

import {
  PERMISSION_DESCRIPTIONS,
  isKnownPermission,
  rolesWithPermission,
  isSystemAdminPermission,
} from '../permission-descriptions'
import { ROLE_PERMISSIONS, STAFF_ROLES } from '@/lib/auth/role-policy'

const ALL_PERMISSIONS = Object.values(ROLE_PERMISSIONS)
  .flatMap((list) => [...(list as readonly string[])])
  .filter((permission, index, all) => all.indexOf(permission) === index)

describe('permission descriptions', () => {
  it('names every permission any role can hold', () => {
    const unnamed = ALL_PERMISSIONS.filter((permission) => !isKnownPermission(permission))
    expect(unnamed).toEqual([])
  })

  it('describes permissions in prose, never as the raw token', () => {
    for (const [permission, description] of Object.entries(PERMISSION_DESCRIPTIONS)) {
      expect(description).not.toContain(':')
      expect(description.length).toBeGreaterThan(5)
    }
  })

  it('rejects an unknown permission from the query string', () => {
    // The page reads ?needs= off the URL; anyone can type anything there.
    expect(isKnownPermission('not-a-permission')).toBe(false)
    expect(isKnownPermission('')).toBe(false)
  })

  it('derives who holds a permission from the policy, not a hand-list', () => {
    // No ROLE grants users:manage any more — it belongs to whoever administers
    // the instance, which is a property of the person, not of their job.
    expect(rolesWithPermission('users:manage')).toEqual([])
    expect(isSystemAdminPermission('users:manage')).toBe(true)
    expect(isSystemAdminPermission('residents:read')).toBe(false)
    // Every role can read the dashboard, so every role must appear here.
    expect(rolesWithPermission('dashboard:read').sort()).toEqual([...STAFF_ROLES].sort())
  })

  it('every permission is reachable by SOMEBODY — a role, or an administrator', () => {
    // "Ask nobody" is the failure this guards. A system permission is answered
    // by isSystemAdminPermission rather than by naming a role.
    for (const permission of ALL_PERMISSIONS) {
      const reachable =
        rolesWithPermission(permission).length > 0 || isSystemAdminPermission(permission)
      expect(reachable).toBe(true)
    }
  })

  it('agrees with the policy for a role that lacks a permission', () => {
    // The Jobcoach case that started this: offered controls it cannot use.
    expect(rolesWithPermission('placements:write')).not.toContain('JOBCOACH')
    expect(rolesWithPermission('residents:write')).not.toContain('JOBCOACH')
    expect(rolesWithPermission('import:write')).not.toContain('JOBCOACH')
    expect(rolesWithPermission('export:read')).not.toContain('JOBCOACH')
    expect(rolesWithPermission('learning:write')).toContain('JOBCOACH')
  })
})
