/**
 * Staff roles and what each one may do.
 *
 * ADMIN is Leitung: the name is kept so live JWTs and existing User rows
 * keep working. The UI says "Leitung".
 *
 * BETREUUNG — daily housing ops (place, incidents, maintenance).
 * SOZIALARBEIT — people and learning; no housing writes, no algorithm.
 * JOBCOACH — learning and resident read; no placements.
 */

export type StaffRole = 'ADMIN' | 'BETREUUNG' | 'SOZIALARBEIT' | 'JOBCOACH'

export const STAFF_ROLES: readonly StaffRole[] = [
  'ADMIN',
  'BETREUUNG',
  'SOZIALARBEIT',
  'JOBCOACH',
] as const

export function isStaffRole(value: string): value is StaffRole {
  return (STAFF_ROLES as readonly string[]).includes(value)
}

const OPERATIONAL = [
  'dashboard:read',
  'residents:read',
  'residents:write',
  'housing:read',
  'housing:write',
  'placements:read',
  'placements:write',
  'incidents:read',
  'incidents:write',
  'maintenance:read',
  'maintenance:write',
  'learning:read',
  'learning:write',
  'export:read',
] as const

export const ROLE_PERMISSIONS = {
  ADMIN: [
    ...OPERATIONAL,
    'users:manage',
    'system:configure',
    'import:write',
  ],
  BETREUUNG: [...OPERATIONAL],
  SOZIALARBEIT: [
    'dashboard:read',
    'residents:read',
    'residents:write',
    'housing:read',
    'incidents:read',
    'incidents:write',
    'learning:read',
    'learning:write',
    'export:read',
  ],
  JOBCOACH: [
    'dashboard:read',
    'residents:read',
    'learning:read',
    'learning:write',
  ],
} as const

export type StaffPermission = (typeof ROLE_PERMISSIONS)[StaffRole][number]

export function canRoleAccess(allowedRoles: StaffRole[], currentRole: StaffRole): boolean {
  return allowedRoles.includes(currentRole)
}

export function hasPermission(role: StaffRole, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[role] as readonly string[]
  return permissions.includes(permission)
}
