/**
 * Who may do what — three orthogonal facts, never one.
 *
 * `role`          WHICH CARE DOMAIN a person is staffed for. 1:1 with CareRole.
 * `scope`         HOW WIDE their view is: their own domain, or all of them.
 * `isSystemAdmin` MAY THEY RECONFIGURE the product: invite staff, settings,
 *                 import. Not implied by seeing everything.
 *
 * These were a single enum, and the real AOZ team could not be described by it.
 * Franziska is a Betreuerin who ALSO sees every client; the only way to say
 * that was to make her ADMIN, which erased her actual domain and handed her the
 * settings page as a side effect. Simon (Jobcoach) and Sandra
 * (Freiwilligenarbeit) work one domain each.
 *
 * This used to end "There is no Leitung." — false, corrected 2026-08-31. AOZ
 * was recruiting a Programmleiter*in and a Teamleiter*in Betreuung for the
 * pilot this product is named after; only THOSE THREE PEOPLE have no lead.
 * A Teamleiter*in is BETREUUNG + ALL_DOMAINS + not isSystemAdmin, so the split
 * already expresses it — do NOT add a LEITUNG role for it.
 *
 * Ask each axis exactly one question and the team describes itself:
 *   Franziska  BETREUUNG          + ALL_DOMAINS
 *   Simon      JOBCOACH           + OWN_DOMAIN
 *   Sandra     FREIWILLIGENARBEIT + OWN_DOMAIN
 */

export type StaffRole = 'ADMIN' | 'BETREUUNG' | 'SOZIALARBEIT' | 'JOBCOACH' | 'FREIWILLIGENARBEIT'

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

/**
 * Roles a NEW account may be given.
 *
 * ADMIN is excluded: it is the old all-in-one value, kept only so live JWTs
 * and existing rows keep resolving. Anything it used to grant is now `scope`
 * and `isSystemAdmin`, which can be given to any role.
 */
export const ASSIGNABLE_STAFF_ROLES: readonly StaffRole[] = STAFF_ROLES.filter(
  (role) => role !== 'ADMIN',
)

export const STAFF_SCOPES = ['OWN_DOMAIN', 'ALL_DOMAINS'] as const
export type StaffScopeId = (typeof STAFF_SCOPES)[number]

export function isStaffScope(value: string): value is StaffScopeId {
  return (STAFF_SCOPES as readonly string[]).includes(value)
}

/**
 * Everything a permission question needs about the person asking.
 *
 * A bare role is no longer enough to answer "may they?", so the type makes
 * that impossible to forget: every call site must hand over the whole subject.
 * The compiler finds them, which is the same reason `displayName` is required
 * rather than optional on resident-shaped types.
 */
export interface StaffCapabilities {
  role: StaffRole
  scope: StaffScopeId
  isSystemAdmin: boolean
}

/**
 * Configuring the product. Held by NOBODY unless explicitly granted.
 *
 * Kept out of ROLE_PERMISSIONS on purpose: no care domain implies the right to
 * invite colleagues or import a spreadsheet, and bundling them is what made
 * every oversight grant also a systems grant.
 */
export const SYSTEM_ADMIN_PERMISSIONS = [
  'users:manage',
  'system:configure',
  'import:write',
] as const

/**
 * Reading and answering complaints about the organisation itself.
 *
 * Held by NO care role, and — this is the part that matters — not by
 * `ALL_DOMAINS` either. Every other permission widens with oversight, because
 * seeing every domain is the point of that axis. This one must not, because
 * the person with oversight over every domain is one of the people a complaint
 * can be ABOUT. A grievance channel whose reader may be its subject is not a
 * grievance channel.
 *
 * Named separately from SYSTEM_ADMIN_PERMISSIONS even though `isSystemAdmin`
 * is what grants both today. They are different jobs: configuring the product
 * and hearing a complaint against staff. AOZ runs a central Beschwerdestelle
 * that is deliberately independent of the site team, and when a real person
 * fills that seat here they should get these two verbs without also being
 * handed the settings page — which is the whole lesson of retiring ADMIN.
 */
export const COMPLAINT_PERMISSIONS = ['complaints:read', 'complaints:respond'] as const

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
  // Every role may READ the directory — Betreuung fields "is there anything I
  // could point them at?" at the kitchen table, not at a desk. Curating it is
  // separate, and belongs to the integration roles below.
  'opportunities:read',
  // Same rule, same reason, for the catalogue of external offers. It used to
  // ride on `residents:write`, which meant the two roles who exist to point
  // people at sport, language and community offers — JOBCOACH and
  // FREIWILLIGENARBEIT — were the two who could not open the page.
  'activities:read',
] as const

/**
 * Career documents — a CV, a certificate, a reference someone can show an
 * employer.
 *
 * Deliberately NOT part of OPERATIONAL, which BETREUUNG inherits whole.
 * Housing operations is running a house: keys, quiet hours, who is in which
 * room. Someone's CV is not a housing fact, and this product's rule everywhere
 * else is the minimum access the work requires. The roles whose work is
 * literally about what a person can show an employer get it; the role that
 * runs the building does not.
 *
 * Leitung gets both, as it gets everything.
 */
const CAREER_DOCUMENTS_READ = 'documents:read'
const CAREER_DOCUMENTS_WRITE = 'documents:write'

export const ROLE_PERMISSIONS = {
  // Legacy. Equivalent to BETREUUNG; what made it special now lives in `scope`
  // and `isSystemAdmin`, which the migration set on every existing ADMIN row.
  ADMIN: [
    ...OPERATIONAL,
    CAREER_DOCUMENTS_READ,
    CAREER_DOCUMENTS_WRITE,
    'opportunities:write',
    'activities:write',
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
    'opportunities:read',
    'opportunities:write',
    'activities:read',
    'activities:write',
    CAREER_DOCUMENTS_READ,
    CAREER_DOCUMENTS_WRITE,
  ],
  JOBCOACH: [
    'dashboard:read',
    'residents:read',
    'learning:read',
    'learning:write',
    'opportunities:read',
    'opportunities:write',
    'activities:read',
    'activities:write',
    CAREER_DOCUMENTS_READ,
    CAREER_DOCUMENTS_WRITE,
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
    'opportunities:read',
    'opportunities:write',
    'activities:read',
    'activities:write',
    // Read only: a volunteering coordinator may need to see a reference
    // before placing someone, but the CV is the job coach's working document.
    CAREER_DOCUMENTS_READ,
  ],
} as const

export type StaffPermission =
  | (typeof ROLE_PERMISSIONS)[StaffRole][number]
  | (typeof SYSTEM_ADMIN_PERMISSIONS)[number]
  | (typeof COMPLAINT_PERMISSIONS)[number]

/**
 * The narrowest possible subject, derived rather than named.
 *
 * Used only where a page renders in the instant between session expiry and the
 * redirect that replaces it. That render previously defaulted to ADMIN — it
 * showed EVERYTHING to a session that had just ended. Showing the least is the
 * safe direction to be wrong in.
 */
export const NARROWEST_CAPABILITIES: StaffCapabilities = {
  role: ASSIGNABLE_STAFF_ROLES.reduce((a, b) =>
    ROLE_PERMISSIONS[a].length <= ROLE_PERMISSIONS[b].length ? a : b,
  ),
  scope: 'OWN_DOMAIN',
  isSystemAdmin: false,
}

/**
 * The widest real account: sees every domain and may configure the product.
 *
 * Note it does NOT use the legacy ADMIN role — that is the point of the split.
 * "Widest" is now a combination anyone can be given, not a role only one
 * person can hold.
 */
export const WIDEST_CAPABILITIES: StaffCapabilities = {
  role: 'BETREUUNG',
  scope: 'ALL_DOMAINS',
  isSystemAdmin: true,
}

export function canRoleAccess(allowedRoles: StaffRole[], currentRole: StaffRole): boolean {
  return allowedRoles.includes(currentRole)
}

function grantsPermission(role: StaffRole, permission: string): boolean {
  return (ROLE_PERMISSIONS[role] as readonly string[]).includes(permission)
}

/**
 * May this person do this?
 *
 * Each axis answers its own question and nothing else:
 *  - a system permission is granted by `isSystemAdmin` ALONE, never by a role;
 *  - ALL_DOMAINS works every seat, so it holds every domain's verbs;
 *  - otherwise the answer is their own domain's verbs.
 */
export function hasPermission(subject: StaffCapabilities, permission: string): boolean {
  if ((SYSTEM_ADMIN_PERMISSIONS as readonly string[]).includes(permission)) {
    return subject.isSystemAdmin
  }

  // Checked HERE, above the role and scope logic, for the same reason system
  // permissions are: falling through would let the `ALL_DOMAINS` branch below
  // grant it, and oversight over every domain must not include reading
  // complaints that may name the person holding it.
  if ((COMPLAINT_PERMISSIONS as readonly string[]).includes(permission)) {
    return subject.isSystemAdmin
  }

  if (grantsPermission(subject.role, permission)) return true

  // Seeing every domain means working every seat — a Betreuerin covering the
  // whole house records learning and reads a CV like the coach would.
  if (subject.scope === 'ALL_DOMAINS') {
    return STAFF_ROLES.some((role) => grantsPermission(role, permission))
  }

  return false
}
