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
import { DASHBOARD_LABELS } from '@/lib/constants/labels'

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

  it('ADMIN (Leitung) sees every section', () => {
    expect(visibleSections('ADMIN')).toEqual(ALL_SECTIONS)
  })

  it('BETREUUNG sees the operational sections but not team health', () => {
    // This is the assertion that used to read `toEqual(ALL_SECTIONS)` for both
    // roles — and it was true, which was the bug. Leitung and Betreuung
    // rendered byte-identical dashboards, because every section mapped to an
    // OPERATIONAL permission and `BETREUUNG: [...OPERATIONAL]`. Leitung's five
    // extra permissions were all page-level, so nothing on the dashboard could
    // tell the two apart.
    expect(visibleSections('BETREUUNG')).toEqual(
      ALL_SECTIONS.filter((section) => section !== 'team')
    )
  })

  it('Leitung and Betreuung do not render the same dashboard', () => {
    // Stated as its own case on purpose: the property that matters is the
    // DIFFERENCE, and a future permission edit that re-merges them should fail
    // on a test that says so, not on an incidental list comparison.
    const leitung = visibleSections('ADMIN')
    const betreuung = visibleSections('BETREUUNG')

    expect(leitung).not.toEqual(betreuung)
    expect(leitung.filter((s) => !betreuung.includes(s))).toEqual(['team'])
  })

  it('team health is visible to exactly the roles that can manage users', () => {
    // Gated on what the role can ACT on, not on seniority. A section reporting
    // unfinished handovers to someone who cannot finish them is noise.
    const canSeeTeam = STAFF_ROLES.filter((role) => sectionVisible(role, 'team'))
    const canManageUsers = STAFF_ROLES.filter((role) =>
      (ROLE_PERMISSIONS[role] as readonly string[]).includes('users:manage')
    )

    expect(canSeeTeam).toEqual(canManageUsers)
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

describe('team health wording', () => {
  // Lives here rather than in ActionDashboard.test.tsx, which mocks QuickStat
  // down to `label: value` and so cannot render a subtext at all.
  it('is singular for one account and plural beyond', () => {
    expect(DASHBOARD_LABELS.statTeamNeverSignedIn(1)).toBe(
      '1 Konto war noch nie angemeldet'
    )
    expect(DASHBOARD_LABELS.statTeamNeverSignedIn(3)).toBe(
      '3 Konten waren noch nie angemeldet'
    )
  })

  it('uses Swiss German — no ß anywhere in the dashboard labels', () => {
    expect(JSON.stringify(DASHBOARD_LABELS)).not.toContain('ß')
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
