import {
  ASSIGNABLE_STAFF_ROLES,
  NARROWEST_CAPABILITIES,
  SYSTEM_ADMIN_PERMISSIONS,
  canRoleAccess,
  hasPermission,
  ROLE_PERMISSIONS,
  STAFF_ROLES,
  type StaffCapabilities,
  type StaffRole,
  type StaffScopeId,
} from '@/lib/auth/role-policy'

/**
 * A subject to ask permission questions about.
 *
 * Defaults mirror a NEW account: one domain, no oversight, no administration.
 * `legacyAdmin()` is what the migration made of every pre-split ADMIN row, so
 * the tests can prove that behaviour did not change for anyone who already
 * existed.
 */
function caps(
  role: StaffRole,
  scope: StaffScopeId = 'OWN_DOMAIN',
  isSystemAdmin = false,
): StaffCapabilities {
  return { role, scope, isSystemAdmin }
}

const legacyAdmin = () => caps('ADMIN', 'ALL_DOMAINS', true)

describe('role policy smoke checks', () => {
  test('ADMIN has all operational permissions', () => {
    expect(hasPermission(legacyAdmin(), 'dashboard:read')).toBe(true)
    expect(hasPermission(legacyAdmin(), 'residents:read')).toBe(true)
    expect(hasPermission(legacyAdmin(), 'residents:write')).toBe(true)
    expect(hasPermission(legacyAdmin(), 'housing:read')).toBe(true)
    expect(hasPermission(legacyAdmin(), 'housing:write')).toBe(true)
    expect(hasPermission(legacyAdmin(), 'placements:read')).toBe(true)
    expect(hasPermission(legacyAdmin(), 'placements:write')).toBe(true)
    expect(hasPermission(legacyAdmin(), 'incidents:read')).toBe(true)
    expect(hasPermission(legacyAdmin(), 'incidents:write')).toBe(true)
    expect(hasPermission(legacyAdmin(), 'maintenance:read')).toBe(true)
    expect(hasPermission(legacyAdmin(), 'maintenance:write')).toBe(true)
  })

  test('ADMIN has high-impact permissions', () => {
    expect(hasPermission(legacyAdmin(), 'users:manage')).toBe(true)
    expect(hasPermission(legacyAdmin(), 'system:configure')).toBe(true)
  })

  test('ADMIN has export and import permissions', () => {
    expect(hasPermission(legacyAdmin(), 'export:read')).toBe(true)
    expect(hasPermission(legacyAdmin(), 'import:write')).toBe(true)
  })

  test('unknown permissions are rejected', () => {
    expect(hasPermission(legacyAdmin(), 'nonexistent:action')).toBe(false)
  })

  test('ROLE_PERMISSIONS.ADMIN contains exactly the expected permissions', () => {
    // The count is the point: it makes a permission added to ADMIN a
    // deliberate edit here rather than something that arrives by inheritance.
    // 24, not 27: users:manage, system:configure and import:write moved OUT of
    // every role and into SYSTEM_ADMIN_PERMISSIONS, which only `isSystemAdmin`
    // grants. No role implies the right to reconfigure the product.
    //
    // 25 since `ai:assist` was named: drafting help used to ride on
    // residents:write, which hid the KI-Assistent from precisely the two roles
    // that write the most prose while the API served them anyway.
    //
    // 26 since `messages:read` was named. It rode on nothing at all — both
    // message surfaces were ungated, so every staff member could read every
    // resident conversation. Naming it is what makes NOT holding it sayable.
    expect(ROLE_PERMISSIONS.ADMIN).toHaveLength(26)
    expect(ROLE_PERMISSIONS.ADMIN).toContain('messages:read')
    expect(ROLE_PERMISSIONS.ADMIN).toContain('ai:assist')
    expect(ROLE_PERMISSIONS.ADMIN).toContain('documents:read')
    expect(ROLE_PERMISSIONS.ADMIN).toContain('documents:write')
    expect(ROLE_PERMISSIONS.ADMIN).toContain('export:read')
    expect(ROLE_PERMISSIONS.ADMIN).toContain('opportunities:read')
    expect(ROLE_PERMISSIONS.ADMIN).toContain('opportunities:write')
    expect(ROLE_PERMISSIONS.ADMIN).toContain('learning:read')
    expect(ROLE_PERMISSIONS.ADMIN).toContain('learning:write')
    expect(ROLE_PERMISSIONS.ADMIN).toContain('marketplace:read')
    expect(ROLE_PERMISSIONS.ADMIN).toContain('marketplace:moderate')
    expect(ROLE_PERMISSIONS.ADMIN).toContain('events:read')
    expect(ROLE_PERMISSIONS.ADMIN).toContain('events:write')
  })

  test('every role can read the opportunity directory', () => {
    // Betreuung fields "is there anything I could point them at?" at the
    // kitchen table. A directory only the integration roles can open is a
    // directory nobody mentions.
    for (const role of STAFF_ROLES) {
      expect(hasPermission(caps(role), 'opportunities:read')).toBe(true)
    }
  })

  test('curating the directory belongs to the integration roles', () => {
    expect(hasPermission(caps('JOBCOACH'), 'opportunities:write')).toBe(true)
    expect(hasPermission(caps('FREIWILLIGENARBEIT'), 'opportunities:write')).toBe(true)
    expect(hasPermission(caps('SOZIALARBEIT'), 'opportunities:write')).toBe(true)
    expect(hasPermission(legacyAdmin(), 'opportunities:write')).toBe(true)
    // Betreuung reads it but does not maintain it — the one role where read
    // and write genuinely differ, which is why the permission is split at all.
    expect(hasPermission(caps('BETREUUNG'), 'opportunities:write')).toBe(false)
  })

  test('JOBCOACH can record learning and cannot place residents', () => {
    expect(hasPermission(caps('JOBCOACH'), 'learning:write')).toBe(true)
    expect(hasPermission(caps('JOBCOACH'), 'residents:read')).toBe(true)
    expect(hasPermission(caps('JOBCOACH'), 'placements:write')).toBe(false)
    expect(hasPermission(caps('JOBCOACH'), 'users:manage')).toBe(false)
  })

  test('SOZIALARBEIT can work with people and learning, not housing writes', () => {
    expect(hasPermission(caps('SOZIALARBEIT'), 'residents:write')).toBe(true)
    expect(hasPermission(caps('SOZIALARBEIT'), 'learning:write')).toBe(true)
    expect(hasPermission(caps('SOZIALARBEIT'), 'housing:write')).toBe(false)
    expect(hasPermission(caps('SOZIALARBEIT'), 'system:configure')).toBe(false)
  })

  test('FREIWILLIGENARBEIT can moderate marketplace and coordinate events, not place residents', () => {
    expect(hasPermission(caps('FREIWILLIGENARBEIT'), 'residents:read')).toBe(true)
    expect(hasPermission(caps('FREIWILLIGENARBEIT'), 'learning:write')).toBe(true)
    expect(hasPermission(caps('FREIWILLIGENARBEIT'), 'marketplace:moderate')).toBe(true)
    expect(hasPermission(caps('FREIWILLIGENARBEIT'), 'events:write')).toBe(true)
    expect(hasPermission(caps('FREIWILLIGENARBEIT'), 'placements:write')).toBe(false)
    expect(hasPermission(caps('FREIWILLIGENARBEIT'), 'housing:write')).toBe(false)
    expect(hasPermission(caps('FREIWILLIGENARBEIT'), 'users:manage')).toBe(false)
  })

  test('canRoleAccess matches ADMIN against allowlist', () => {
    expect(canRoleAccess(['ADMIN'], 'ADMIN')).toBe(true)
  })

  test('canRoleAccess rejects when ADMIN is not in allowlist', () => {
    expect(canRoleAccess([] as unknown as 'ADMIN'[], 'ADMIN')).toBe(false)
  })
})

/**
 * The three axes, and that each answers ONLY its own question.
 *
 * They were one enum, and the real AOZ team could not be described by it:
 * Franziska is a Betreuerin who ALSO sees every client, and saying so meant
 * making her ADMIN — which erased her domain and handed her the settings page.
 */
describe('role, scope and administration are independent', () => {
  const franziska = caps('BETREUUNG', 'ALL_DOMAINS')
  const simon = caps('JOBCOACH')
  const sandra = caps('FREIWILLIGENARBEIT')

  test('a system permission is granted by isSystemAdmin ALONE, never by a role', () => {
    for (const permission of SYSTEM_ADMIN_PERMISSIONS) {
      for (const role of STAFF_ROLES) {
        // Not even with oversight over every domain.
        expect(hasPermission(caps(role, 'ALL_DOMAINS'), permission)).toBe(false)
        expect(hasPermission(caps(role, 'OWN_DOMAIN', true), permission)).toBe(true)
      }
    }
  })

  test('seeing every domain grants every domain’s verbs', () => {
    // Franziska covers the whole house, so she records learning and reads a CV
    // the way the coach would — without being an administrator.
    expect(hasPermission(franziska, 'learning:write')).toBe(true)
    expect(hasPermission(franziska, 'documents:read')).toBe(true)
    expect(hasPermission(franziska, 'opportunities:write')).toBe(true)
    expect(hasPermission(franziska, 'users:manage')).toBe(false)
    expect(hasPermission(franziska, 'system:configure')).toBe(false)
  })

  test('one domain grants only that domain’s verbs', () => {
    expect(hasPermission(simon, 'learning:write')).toBe(true)
    expect(hasPermission(simon, 'placements:write')).toBe(false)
    expect(hasPermission(simon, 'housing:write')).toBe(false)

    expect(hasPermission(sandra, 'marketplace:moderate')).toBe(true)
    expect(hasPermission(sandra, 'documents:write')).toBe(false)
    expect(hasPermission(sandra, 'placements:write')).toBe(false)
  })

  test('the integration roles SEE a conflict but never work it', () => {
    // The asymmetry is the whole grant, and a later "these two look
    // inconsistent, let me line them up" edit would destroy it in either
    // direction: taking read away re-blinds them, adding write puts the
    // conflict ladder in the hands of roles that do not run it.
    //
    // Why they need read at all: the old boundary was survivable because
    // staff shared a corridor and overheard that a household was in trouble.
    // Distributed housing removes that, and a coach placing someone into work
    // or a group activity should not be the last to know.
    for (const viewer of [simon, sandra]) {
      expect(hasPermission(viewer, 'incidents:read')).toBe(true)
      expect(hasPermission(viewer, 'incidents:write')).toBe(false)
    }

    // Logging and escalating stay where they were.
    expect(hasPermission(caps('BETREUUNG'), 'incidents:write')).toBe(true)
    expect(hasPermission(caps('SOZIALARBEIT'), 'incidents:write')).toBe(true)
  })

  test('scope changes breadth without changing the role', () => {
    // The same person, the same job, one axis moved.
    expect(hasPermission(caps('JOBCOACH'), 'housing:write')).toBe(false)
    expect(hasPermission(caps('JOBCOACH', 'ALL_DOMAINS'), 'housing:write')).toBe(true)
    expect(caps('JOBCOACH', 'ALL_DOMAINS').role).toBe('JOBCOACH')
  })

  test('the migrated legacy ADMIN keeps exactly what ADMIN used to mean', () => {
    // Every pre-split row was given ALL_DOMAINS + isSystemAdmin, so nobody who
    // already existed lost or gained anything on the day this shipped.
    for (const permission of SYSTEM_ADMIN_PERMISSIONS) {
      expect(hasPermission(legacyAdmin(), permission)).toBe(true)
    }
    expect(hasPermission(legacyAdmin(), 'housing:write')).toBe(true)
    expect(hasPermission(legacyAdmin(), 'documents:write')).toBe(true)
  })

  test('a new account may not be given the retired all-in-one role', () => {
    expect(ASSIGNABLE_STAFF_ROLES).not.toContain('ADMIN')
    expect(ASSIGNABLE_STAFF_ROLES).toHaveLength(STAFF_ROLES.length - 1)
  })

  test('a team lead is a SHAPE, not a role — no LEITUNG value may be added', () => {
    // This file used to assert, in prose, that "there is no Leitung". That was
    // wrong: AOZ was recruiting a Programmleiter*in and a Teamleiter*in
    // Betreuung for the `Begleitung im regulären Wohnraum` pilot this product
    // is named after. Only those three named people have no lead among them.
    //
    // The correction must not become a new enum value. Leading a care team is
    // reach over that team's clients — `ALL_DOMAINS` — and NOT the right to
    // reconfigure the product. That is exactly the pair `ADMIN` bundled and was
    // retired for, so re-adding LEITUNG would rebuild the bug under a new name.
    for (const role of STAFF_ROLES) {
      expect(role).not.toMatch(/LEITUNG|LEAD|MANAGER/)
    }

    // The shape itself, stated once so the org fact lives in a test and not
    // only in a comment: a Teamleiter*in Betreuung works every seat and
    // administers nothing.
    const teamleiterin = caps('BETREUUNG', 'ALL_DOMAINS', false)
    expect(hasPermission(teamleiterin, 'placements:write')).toBe(true)
    expect(hasPermission(teamleiterin, 'learning:write')).toBe(true)
    expect(hasPermission(teamleiterin, 'users:manage')).toBe(false)
    expect(hasPermission(teamleiterin, 'system:configure')).toBe(false)
  })

  test('the narrowest subject can do less than any real one', () => {
    // It stands in for a render whose session has just expired; it used to
    // default to ADMIN, i.e. show everything.
    expect(NARROWEST_CAPABILITIES.scope).toBe('OWN_DOMAIN')
    expect(NARROWEST_CAPABILITIES.isSystemAdmin).toBe(false)
    expect(hasPermission(NARROWEST_CAPABILITIES, 'users:manage')).toBe(false)
    expect(hasPermission(NARROWEST_CAPABILITIES, 'placements:write')).toBe(false)
  })
})
