export type StaffRole = 'ADMIN' | 'CASE_WORKER' | 'VIEWER'

/**
 * Minimal RBAC policy for smoke checks.
 * Principle: viewers are read-only, case workers can operate daily workflows,
 * admins can perform high-impact configuration/user management.
 */
export const ROLE_PERMISSIONS = {
  ADMIN: [
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
    'users:manage',
    'system:configure',
  ],
  CASE_WORKER: [
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
  ],
  VIEWER: [
    'dashboard:read',
    'residents:read',
    'housing:read',
    'placements:read',
    'incidents:read',
    'maintenance:read',
  ],
} as const

export type StaffPermission = (typeof ROLE_PERMISSIONS)[StaffRole][number]

// Union of all permissions across all roles
type AllPermissions = (typeof ROLE_PERMISSIONS)[keyof typeof ROLE_PERMISSIONS][number]

export function canRoleAccess(allowedRoles: StaffRole[], currentRole: StaffRole): boolean {
  return allowedRoles.includes(currentRole)
}

export function hasPermission(role: StaffRole, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[role] as readonly AllPermissions[]
  return permissions.includes(permission as AllPermissions)
}
