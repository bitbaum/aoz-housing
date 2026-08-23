/**
 * Staff roles and what each one may do.
 *
 * ADMIN is Leitung: the name is kept so live JWTs and existing User rows
 * keep working. The UI says "Leitung".
 *
 * BETREUUNG — daily housing ops (place, incidents, maintenance).
 * SOZIALARBEIT — people and learning; no housing writes.
 * JOBCOACH — learning and resident read; no placements.
 * FREIWILLIGENARBEIT — volunteering coordination; learning + marketplace/
 * events own-domain writes, no housing/placement writes.
 */

export type StaffRole =
  | 'ADMIN'
  | 'BETREUUNG'
  | 'SOZIALARBEIT'
  | 'JOBCOACH'
  | 'FREIWILLIGENARBEIT'

export const STAFF_ROLES: readonly StaffRole[] = [
  'ADMIN',
  'BETREUUNG',
  'SOZIALARBEIT',
  'JOBCOACH',
  'FREIWILLIGENARBEIT',
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
  'marketplace:read',
  'marketplace:moderate',
  'events:read',
  'events:write',
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
    'marketplace:read',
    'events:read',
    'events:write',
  ],
  JOBCOACH: [
    'dashboard:read',
    'residents:read',
    'learning:read',
    'learning:write',
  ],
  FREIWILLIGENARBEIT: [
    'dashboard:read',
    'residents:read',
    'learning:read',
    'learning:write',
    'marketplace:read',
    'marketplace:moderate',
    'events:read',
    'events:write',
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
