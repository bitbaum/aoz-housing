import { canRoleAccess, hasPermission } from '@/lib/auth/role-policy'

describe('role policy smoke checks', () => {
  test('viewer stays read-only', () => {
    expect(hasPermission('VIEWER', 'dashboard:read')).toBe(true)
    expect(hasPermission('VIEWER', 'residents:write')).toBe(false)
    expect(hasPermission('VIEWER', 'users:manage')).toBe(false)
  })

  test('case worker can perform operational writes but not admin config', () => {
    expect(hasPermission('CASE_WORKER', 'placements:write')).toBe(true)
    expect(hasPermission('CASE_WORKER', 'incidents:write')).toBe(true)
    expect(hasPermission('CASE_WORKER', 'users:manage')).toBe(false)
    expect(hasPermission('CASE_WORKER', 'system:configure')).toBe(false)
  })

  test('admin includes high-impact permissions', () => {
    expect(hasPermission('ADMIN', 'users:manage')).toBe(true)
    expect(hasPermission('ADMIN', 'system:configure')).toBe(true)
  })

  test('role allowlist checks are explicit', () => {
    expect(canRoleAccess(['ADMIN', 'CASE_WORKER'], 'CASE_WORKER')).toBe(true)
    expect(canRoleAccess(['ADMIN'], 'VIEWER')).toBe(false)
  })
})
