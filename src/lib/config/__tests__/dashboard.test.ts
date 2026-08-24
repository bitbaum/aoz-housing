/**
 * The dashboard section map is what makes the admin dashboard role-aware:
 * these tests pin the OUTCOME per role, so a permission edit in role-policy
 * that silently reshapes someone's dashboard fails here first.
 */

import {
  DASHBOARD_SECTIONS,
  DASHBOARD_FALLBACK_CTAS,
  sectionVisible,
  fallbackCta,
  workspaceState,
  setupCta,
  type DashboardSection,
} from '../dashboard'
import { ROLE_PERMISSIONS, STAFF_ROLES } from '@/lib/auth/role-policy'

const ALL_SECTIONS = Object.keys(DASHBOARD_SECTIONS) as DashboardSection[]

function visibleSections(role: (typeof STAFF_ROLES)[number]): DashboardSection[] {
  return ALL_SECTIONS.filter((s) => sectionVisible(role, s))
}

describe('DASHBOARD_SECTIONS', () => {
  it('every section permission exists in the ADMIN permission set (superset)', () => {
    const adminPerms = ROLE_PERMISSIONS.ADMIN as readonly string[]
    for (const permission of Object.values(DASHBOARD_SECTIONS)) {
      expect(adminPerms).toContain(permission)
    }
  })

  it('ADMIN and BETREUUNG see every section', () => {
    expect(visibleSections('ADMIN')).toEqual(ALL_SECTIONS)
    expect(visibleSections('BETREUUNG')).toEqual(ALL_SECTIONS)
  })

  it('JOBCOACH sees exactly the learning section — their dashboard is their board', () => {
    expect(visibleSections('JOBCOACH')).toEqual(['learning'])
  })

  it('FREIWILLIGENARBEIT sees learning and events, nothing housing', () => {
    expect(visibleSections('FREIWILLIGENARBEIT')).toEqual(['learning', 'events'])
  })

  it('SOZIALARBEIT sees people/conflict/governance sections but no placement writes', () => {
    const sections = visibleSections('SOZIALARBEIT')
    expect(sections).toContain('incidents')
    expect(sections).toContain('proposals')
    expect(sections).toContain('learning')
    expect(sections).toContain('events')
    expect(sections).toContain('occupancy')
    expect(sections).not.toContain('checkIns')
    expect(sections).not.toContain('maintenance')
    expect(sections).not.toContain('matching')
    expect(sections).not.toContain('transferRequests')
  })

  it('every role sees at least one section — nobody gets an empty dashboard', () => {
    for (const role of STAFF_ROLES) {
      expect(visibleSections(role).length).toBeGreaterThan(0)
    }
  })
})

describe('fallbackCta', () => {
  it('resolves for every role (last entry is readable by all staff)', () => {
    for (const role of STAFF_ROLES) {
      expect(fallbackCta(role)).toBeDefined()
    }
  })

  it('offers resident intake to roles that can create residents', () => {
    expect(fallbackCta('ADMIN').href).toBe('/residents/new')
    expect(fallbackCta('BETREUUNG').href).toBe('/residents/new')
    expect(fallbackCta('SOZIALARBEIT').href).toBe('/residents/new')
  })

  it('offers learning to coaching roles without residents:write', () => {
    expect(fallbackCta('JOBCOACH').href).toBe('/learning')
    expect(fallbackCta('FREIWILLIGENARBEIT').href).toBe('/learning')
  })

  it('final fallback is gated on a permission every role holds', () => {
    const last = DASHBOARD_FALLBACK_CTAS[DASHBOARD_FALLBACK_CTAS.length - 1]
    for (const role of STAFF_ROLES) {
      expect(ROLE_PERMISSIONS[role] as readonly string[]).toContain(last.permission)
    }
  })

  // ── Empty vs quiet ────────────────────────────────────────────────────────

  it('calls a workspace with no people empty, however many queues are clear', () => {
    expect(workspaceState({ residentCount: 0, openTaskCount: 0 })).toBe('empty')
  })

  it('distinguishes a quiet day from an unstarted one', () => {
    expect(workspaceState({ residentCount: 12, openTaskCount: 0 })).toBe('quiet')
    expect(workspaceState({ residentCount: 12, openTaskCount: 3 })).toBe('busy')
  })

  it('never calls an empty workspace busy, even with stray queue rows', () => {
    // Work listed for nobody is a data fault, not a to-do list.
    expect(workspaceState({ residentCount: 0, openTaskCount: 5 })).toBe('empty')
  })

  it('starts setup at housing while there is none', () => {
    expect(setupCta('ADMIN', { housingUnitCount: 0 })?.href).toBe('/housing/new')
  })

  it('moves setup to resident intake once housing exists', () => {
    expect(setupCta('ADMIN', { housingUnitCount: 3 })?.href).toBe('/residents/new')
  })

  it('sends roles that cannot create housing straight to resident intake', () => {
    // Sozialarbeit holds residents:write but not housing:write.
    expect(setupCta('SOZIALARBEIT', { housingUnitCount: 0 })?.href).toBe('/residents/new')
  })

  it('offers no setup step to a role that may create neither', () => {
    // Any button here would land on /kein-zugriff — the dead end PR #88 removed.
    expect(setupCta('JOBCOACH', { housingUnitCount: 0 })).toBeNull()
    expect(setupCta('FREIWILLIGENARBEIT', { housingUnitCount: 2 })).toBeNull()
  })
})
