import { canRoleAccess, hasPermission, ROLE_PERMISSIONS } from '@/lib/auth/role-policy'

describe('role policy smoke checks', () => {
  test('ADMIN has all operational permissions', () => {
    expect(hasPermission('ADMIN', 'dashboard:read')).toBe(true)
    expect(hasPermission('ADMIN', 'residents:read')).toBe(true)
    expect(hasPermission('ADMIN', 'residents:write')).toBe(true)
    expect(hasPermission('ADMIN', 'housing:read')).toBe(true)
    expect(hasPermission('ADMIN', 'housing:write')).toBe(true)
    expect(hasPermission('ADMIN', 'placements:read')).toBe(true)
    expect(hasPermission('ADMIN', 'placements:write')).toBe(true)
    expect(hasPermission('ADMIN', 'incidents:read')).toBe(true)
    expect(hasPermission('ADMIN', 'incidents:write')).toBe(true)
    expect(hasPermission('ADMIN', 'maintenance:read')).toBe(true)
    expect(hasPermission('ADMIN', 'maintenance:write')).toBe(true)
  })

  test('ADMIN has high-impact permissions', () => {
    expect(hasPermission('ADMIN', 'users:manage')).toBe(true)
    expect(hasPermission('ADMIN', 'system:configure')).toBe(true)
  })

  test('ADMIN has export and import permissions', () => {
    expect(hasPermission('ADMIN', 'export:read')).toBe(true)
    expect(hasPermission('ADMIN', 'import:write')).toBe(true)
  })

  test('unknown permissions are rejected', () => {
    expect(hasPermission('ADMIN', 'nonexistent:action')).toBe(false)
  })

  test('ROLE_PERMISSIONS.ADMIN contains exactly the expected permissions', () => {
    expect(ROLE_PERMISSIONS.ADMIN).toHaveLength(17)
    expect(ROLE_PERMISSIONS.ADMIN).toContain('export:read')
    expect(ROLE_PERMISSIONS.ADMIN).toContain('import:write')
    expect(ROLE_PERMISSIONS.ADMIN).toContain('learning:read')
    expect(ROLE_PERMISSIONS.ADMIN).toContain('learning:write')
  })

  test('JOBCOACH can record learning and cannot place residents', () => {
    expect(hasPermission('JOBCOACH', 'learning:write')).toBe(true)
    expect(hasPermission('JOBCOACH', 'residents:read')).toBe(true)
    expect(hasPermission('JOBCOACH', 'placements:write')).toBe(false)
    expect(hasPermission('JOBCOACH', 'users:manage')).toBe(false)
  })

  test('SOZIALARBEIT can work with people and learning, not housing writes', () => {
    expect(hasPermission('SOZIALARBEIT', 'residents:write')).toBe(true)
    expect(hasPermission('SOZIALARBEIT', 'learning:write')).toBe(true)
    expect(hasPermission('SOZIALARBEIT', 'housing:write')).toBe(false)
    expect(hasPermission('SOZIALARBEIT', 'system:configure')).toBe(false)
  })

  test('canRoleAccess matches ADMIN against allowlist', () => {
    expect(canRoleAccess(['ADMIN'], 'ADMIN')).toBe(true)
  })

  test('canRoleAccess rejects when ADMIN is not in allowlist', () => {
    expect(canRoleAccess([] as unknown as ('ADMIN')[], 'ADMIN')).toBe(false)
  })
})
