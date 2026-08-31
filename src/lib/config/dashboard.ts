/**
 * Dashboard composition — SSOT for which role sees which dashboard surface.
 *
 * The dashboard used to hardcode the housing/placement widgets for everyone:
 * a Jobcoach or Freiwilligenarbeit coordinator logged in and saw "freie
 * Betten" and a matching CTA — none of it their work — and nothing from the
 * pillars that ARE their work (learning, events). The permission model in
 * role-policy.ts already IS the definition of "what is this person's daily
 * work"; this file only maps each dashboard section onto the permission that
 * makes the section that role's business. Consumed by the page (to skip the
 * queries a role cannot see) and by ActionDashboard (to gate rendering) —
 * one mapping, two readers, so they can never disagree.
 */

import {
  hasPermission,
  type StaffCapabilities,
  type StaffPermission,
  type StaffRole,
} from '@/lib/auth/role-policy'

export const DASHBOARD_SECTIONS = {
  /** Free-beds stat. */
  occupancy: 'housing:read',
  /** Check-in stat, overdue/due-soon tiles, check-in hero branches. */
  checkIns: 'placements:read',
  /** Harmony stat, critical-incident banner, problem-unit tiles. */
  incidents: 'incidents:read',
  /** Open-maintenance stat. */
  maintenance: 'maintenance:read',
  /** Unplaced-residents tile + hero branch — they link into /matching. */
  matching: 'placements:write',
  /** Pending transfer-request queue — resolved on /transfer-requests. */
  transferRequests: 'placements:write',
  /**
   * Proposals awaiting a staff answer — resolved on /rules. Gated like the
   * /rules nav item itself (see MEGAMENU_GROUPS), not by a governance-specific
   * permission that does not exist.
   */
  proposals: 'housing:read',
  /** Learning pulse — in-progress records and recent completions. */
  learning: 'learning:read',
  /** Upcoming published events. */
  events: 'events:read',
  /**
   * Team health — staff accounts, and how many have never signed in.
   *
   * THE ONLY SECTION LEITUNG SEES AND BETREUUNG DOES NOT, and that is the
   * point. `BETREUUNG: [...OPERATIONAL]` while ADMIN is `[...OPERATIONAL, +5]`,
   * and every one of those five (`users:manage`, `system:configure`,
   * `import:write`, `opportunities:write`, `activities:write`) was a PAGE
   * permission that no dashboard section mapped to. So the two roles rendered
   * byte-identical dashboards — the mechanism for differentiating them existed
   * and simply had nothing keyed to it.
   *
   * Gated on `users:manage` rather than invented: it reports on the thing only
   * Leitung can actually act on. A provisioned staff code nobody has ever used
   * is invisible everywhere else in the product, and it is precisely the kind
   * of loose end the person managing the team is responsible for.
   */
  team: 'users:manage',
} as const satisfies Record<string, StaffPermission>

export type DashboardSection = keyof typeof DASHBOARD_SECTIONS

export function sectionVisible(viewer: StaffCapabilities, section: DashboardSection): boolean {
  return hasPermission(viewer, DASHBOARD_SECTIONS[section])
}

/**
 * All-clear hero CTA: when nothing is urgent, offer the first action the role
 * may actually perform — not /residents/new for a Jobcoach who cannot create
 * residents. Order is deliberate: creating a resident is the product's main
 * intake, learning is the coaching roles' home, analytics is readable by
 * every staff role and therefore the guaranteed last resort.
 */
export const DASHBOARD_FALLBACK_CTAS: readonly {
  permission: StaffPermission
  href: string
  labelKey: 'actionCreateResident' | 'actionOpenLearning' | 'actionViewStats'
}[] = [
  { permission: 'residents:write', href: '/residents/new', labelKey: 'actionCreateResident' },
  { permission: 'learning:write', href: '/learning', labelKey: 'actionOpenLearning' },
  { permission: 'dashboard:read', href: '/analytics', labelKey: 'actionViewStats' },
]

export function fallbackCta(viewer: StaffCapabilities): (typeof DASHBOARD_FALLBACK_CTAS)[number] {
  // dashboard:read is in every role, so the find can never miss.
  return DASHBOARD_FALLBACK_CTAS.find((cta) => hasPermission(viewer, cta.permission))!
}

/**
 * Whether this workspace has nothing YET, nothing RIGHT NOW, or work waiting.
 *
 * The dashboard used to collapse the first two. On a database with no people
 * in it every queue is empty, so every check passed and the page reported
 * "Alles erledigt!" and "Alles unter Kontrolle!" — twice, with the same
 * button under each. Nothing was under control; there was simply nothing.
 * That is the single most misleading screen a new AOZ team could be handed,
 * because it says the setup they have not started is finished.
 *
 * Emptiness is measured in PEOPLE, not units: this product exists to support
 * residents, and a workspace with buildings and nobody in them has not begun.
 */
export type WorkspaceState = 'empty' | 'quiet' | 'busy'

export function workspaceState({
  residentCount,
  openTaskCount,
}: {
  residentCount: number
  openTaskCount: number
}): WorkspaceState {
  if (residentCount === 0) return 'empty'
  return openTaskCount > 0 ? 'busy' : 'quiet'
}

/**
 * The first real setup step, for a workspace that has no data yet.
 *
 * Returns null when this role cannot set anything up — a Jobcoach may neither
 * create housing nor create residents, and offering them a button that ends
 * at /kein-zugriff repeats the mistake PR #88 fixed. They get the explanation
 * without the dead end. @see app/(admin)/kein-zugriff/page.tsx
 */
export interface SetupStep {
  href: string
  labelKey: 'setupCreateHousing' | 'setupCreateResident'
}

export function setupCta(
  viewer: StaffCapabilities,
  { housingUnitCount }: { housingUnitCount: number },
): SetupStep | null {
  // Housing first, but only while there is none: residents are placed INTO
  // units, so an instance with no unit cannot complete an intake.
  if (housingUnitCount === 0 && hasPermission(viewer, 'housing:write')) {
    return { href: '/housing/new', labelKey: 'setupCreateHousing' }
  }
  if (hasPermission(viewer, 'residents:write')) {
    return { href: '/residents/new', labelKey: 'setupCreateResident' }
  }
  return null
}
