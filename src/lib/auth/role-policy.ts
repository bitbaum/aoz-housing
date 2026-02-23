export type StaffRole = 'ADMIN'

/**
 * Single ADMIN role — all staff have full access.
 * Kept as a permissions map for future extensibility and existing code compatibility.
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
    'export:read',
    'import:write',
  ],
} as const

export type StaffPermission = (typeof ROLE_PERMISSIONS)[StaffRole][number]

export function canRoleAccess(allowedRoles: StaffRole[], currentRole: StaffRole): boolean {
  return allowedRoles.includes(currentRole)
}

export function hasPermission(role: StaffRole, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[role] as readonly StaffPermission[]
  return permissions.includes(permission as StaffPermission)
}
