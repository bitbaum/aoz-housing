import {
  isPublicRoute,
  requiresResidentAuth,
  requiresStaffAuth,
} from '@/lib/auth/route-boundaries'

describe('auth route boundaries', () => {
  test('public routes are public', () => {
    expect(isPublicRoute('/portal')).toBe(true)
    expect(isPublicRoute('/portal/help')).toBe(true)
    expect(isPublicRoute('/login')).toBe(true)
    expect(isPublicRoute('/api/auth/login')).toBe(true)
  })

  test('staff routes require staff auth', () => {
    expect(requiresStaffAuth('/')).toBe(true)
    expect(requiresStaffAuth('/residents')).toBe(true)
    expect(requiresStaffAuth('/housing/abc')).toBe(true)
    expect(requiresStaffAuth('/portal')).toBe(false)
  })

  test('resident routes require resident auth', () => {
    expect(requiresResidentAuth('/portal/preferences')).toBe(true)
    expect(requiresResidentAuth('/portal/chores/123')).toBe(true)
    expect(requiresResidentAuth('/api/portal/preferences')).toBe(true)
    expect(requiresResidentAuth('/api/portal/chores/abc/complete')).toBe(true)
    expect(requiresResidentAuth('/login')).toBe(false)
    expect(requiresResidentAuth('/api/auth/login')).toBe(false)
  })

  test('staff and resident boundaries stay separated', () => {
    expect(requiresStaffAuth('/portal/preferences')).toBe(false)
    expect(requiresResidentAuth('/residents')).toBe(false)
  })
})
