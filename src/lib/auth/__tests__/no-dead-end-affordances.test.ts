import fs from 'fs'
import path from 'path'
import { STAFF_ROLES, hasPermission, type StaffCapabilities } from '../role-policy'

/**
 * A page may not offer what its viewer cannot reach.
 *
 * The nav has followed this rule for a while — `MEGAMENU_GROUPS` gates every
 * entry on the permission its route requires, because an item ending at
 * /kein-zugriff is "a dead end dressed as a destination". Pages inside those
 * routes were never held to it, and the gap stayed invisible for a structural
 * reason: while the only people who could OPEN a board were the people who
 * could also act on it, an ungated button was indistinguishable from a gated
 * one.
 *
 * Giving JOBCOACH and FREIWILLIGENARBEIT read-only sight of incidents broke
 * that coincidence and made two dead ends real at once — "Vorfall melden"
 * (needs `incidents:write`) and the CSV export link (needs `export:read`),
 * both rendered unconditionally on a board that only requires
 * `incidents:read`. Verified in production before the fix.
 *
 * This gate reads the SOURCE rather than rendering, because the page is an
 * async server component with a live Prisma query and this repo has no
 * harness for that. It is narrow on purpose: it checks the specific pairs
 * that a role can now reach without holding, not "every link everywhere".
 */

const ADMIN_DIR = path.resolve(__dirname, '../../../app/(admin)')

const caps = (role: (typeof STAFF_ROLES)[number]): StaffCapabilities => ({
  role,
  scope: 'OWN_DOMAIN',
  isSystemAdmin: false,
})

describe('the incidents board offers nothing its readers cannot do', () => {
  const source = fs.readFileSync(path.join(ADMIN_DIR, 'incidents/page.tsx'), 'utf8')

  it('there is a role that can open the board but not write to it', () => {
    // If this ever becomes false the rest of this file is testing nothing —
    // the dead ends were invisible for exactly this reason before.
    const readersWhoCannotWrite = STAFF_ROLES.filter(
      (role) =>
        hasPermission(caps(role), 'incidents:read') &&
        !hasPermission(caps(role), 'incidents:write'),
    )
    expect(readersWhoCannotWrite.length).toBeGreaterThan(0)
  })

  it('gates the "new incident" affordance on incidents:write', () => {
    expect(source).toMatch(/canWriteIncidents\s*=\s*hasPermission\(viewer,\s*'incidents:write'\)/)

    // Every link to the create page must sit behind that flag. Counting is the
    // point: there are two, and gating only the visible one is the shape of
    // bug this file exists to catch.
    const createLinks = source.match(/href="\/incidents\/new"/g) ?? []
    const gatedCreates =
      source.match(/canWriteIncidents\s*&&\s*\(?\s*\n?\s*<Link href="\/incidents\/new"/g) ?? []
    expect({ links: createLinks.length, gated: gatedCreates.length }).toEqual({
      links: createLinks.length,
      gated: createLinks.length,
    })
  })

  it('gates the CSV export affordance on export:read', () => {
    expect(source).toMatch(/canExport\s*=\s*hasPermission\(viewer,\s*'export:read'\)/)
    expect(source).toMatch(
      /canExport\s*&&\s*\(?\s*\n?\s*<a\s*\n?\s*href="\/api\/export\/incidents"/,
    )
  })

  it('the roles that can read but not write hold neither affordance’s permission', () => {
    // Names the actual consequence rather than trusting the flags: these are
    // the people who were being offered both buttons.
    for (const role of ['JOBCOACH', 'FREIWILLIGENARBEIT'] as const) {
      expect({
        role,
        read: hasPermission(caps(role), 'incidents:read'),
        write: hasPermission(caps(role), 'incidents:write'),
        exportData: hasPermission(caps(role), 'export:read'),
      }).toEqual({ role, read: true, write: false, exportData: false })
    }
  })
})
