/**
 * One area, one name.
 *
 * This part of the product answered to four different names at once: the nav
 * said "Lernen & Beruf", the page heading and browser tab said
 * "Integrationsnachweise", the dashboard tile said "Lernen & Kurse", and the
 * permission descriptions said "Integrationsnachweise" again. A Jobcoach told
 * to open one of them arrived somewhere that called itself another, with
 * nothing on screen connecting the two.
 *
 * Naming is not cosmetic here: `/kein-zugriff` names the area a role is
 * missing, and it has to name the same area the nav does or the explanation
 * explains nothing.
 *
 * Derived from the source files rather than a hand-written list, because a
 * hand-written list drifts exactly like the labels it guards.
 */

import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { LEARNING_AREA_NAME, LEARNING_LABELS } from '../learning'
import { MEGAMENU_GROUPS, SYSTEM_LINKS } from '../navigation'
import { PERMISSION_DESCRIPTIONS } from '../permission-descriptions'
import { DASHBOARD_LABELS } from '@/lib/constants/labels'

/** Names this area has answered to, all of which must now be gone. */
const RETIRED_NAMES = ['Integrationsnachweise', 'Lernen & Kurse']

const SRC = join(__dirname, '..', '..', '..')

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      return entry.name === 'node_modules' ? [] : sourceFiles(full)
    }
    return /\.tsx?$/.test(entry.name) && !full.includes('__tests__') ? [full] : []
  })
}

describe('learning area name', () => {
  it('finds the source tree', () => {
    // Guards the guard: a wrong path makes the sweep below vacuously green.
    expect(sourceFiles(SRC).length).toBeGreaterThan(100)
  })

  it('is the same name in the nav, the page, the dashboard and the denial page', () => {
    const navLabels = [
      ...MEGAMENU_GROUPS.flatMap((group) =>
        'items' in group ? group.items.map((item) => item.label) : [group.label],
      ),
      ...SYSTEM_LINKS.map((link) => link.label),
    ]

    expect(navLabels).toContain(LEARNING_AREA_NAME)
    expect(LEARNING_LABELS.boardTitle).toBe(LEARNING_AREA_NAME)
    expect(DASHBOARD_LABELS.statLearning).toBe(LEARNING_AREA_NAME)
    expect(PERMISSION_DESCRIPTIONS['learning:read']).toContain(LEARNING_AREA_NAME)
  })

  it.each(RETIRED_NAMES)('no longer says "%s" anywhere in src/', (retired) => {
    // The SSOT itself is exempt: it documents WHICH names were retired, and a
    // rule whose reason cannot be written down next to it gets undone by the
    // next person who finds it inconvenient.
    const ssot = join(SRC, 'lib', 'config', 'learning.ts')
    const offenders = sourceFiles(SRC)
      .filter((file) => file !== ssot)
      .filter((file) => readFileSync(file, 'utf8').includes(retired))

    expect(offenders.map((f) => f.replace(SRC, 'src'))).toEqual([])
  })
})
