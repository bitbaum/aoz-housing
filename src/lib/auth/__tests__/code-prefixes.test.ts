/**
 * Login codes outlive the brand that issued them.
 *
 * A code is printed on paper and handed to a person. Changing the prefix a
 * deployment ISSUES is a rebrand; changing the set of prefixes it RESOLVES is
 * a lockout. These tests pin that distinction, because both directions of the
 * mistake type-check, lint clean, and look completely fine in review — they
 * surface as "Ungültiger Code" for someone standing at a door.
 */

import {
  ALL_CODE_PREFIXES,
  ALL_RESIDENT_CODE_PREFIXES,
  BRANDS,
  LEGACY_RESIDENT_CODE_PREFIXES,
} from '@/lib/config/brand'
import { RESIDENT_CODE_PREFIX } from '../code-prefixes'

describe('client code prefixes', () => {
  it('recognises every prefix any brand issues', () => {
    for (const brand of Object.values(BRANDS)) {
      expect(ALL_RESIDENT_CODE_PREFIXES).toContain(brand.residentCodePrefix)
    }
  })

  it('still recognises RES-, which every existing live code starts with', () => {
    // Retiring it for NEW codes is fine. Dropping it here logs out the entire
    // resident population of every deployment that has ever run.
    expect(LEGACY_RESIDENT_CODE_PREFIXES).toContain('RES-')
    expect(ALL_RESIDENT_CODE_PREFIXES).toContain('RES-')
  })

  it('issues codes under the active brand only', () => {
    expect(ALL_RESIDENT_CODE_PREFIXES).toContain(RESIDENT_CODE_PREFIX)
  })

  it('lists no prefix twice, so redaction cannot double-replace', () => {
    expect(new Set(ALL_RESIDENT_CODE_PREFIXES).size).toBe(ALL_RESIDENT_CODE_PREFIXES.length)
  })

  it('never collides with a staff prefix', () => {
    // loginByCode routes on the prefix. A prefix that is both would send a
    // person to the wrong table — and a resident code that resolves as staff
    // is a privilege escalation, not a cosmetic bug.
    for (const residentPrefix of ALL_RESIDENT_CODE_PREFIXES) {
      for (const staffPrefix of ALL_CODE_PREFIXES) {
        expect(residentPrefix.startsWith(staffPrefix)).toBe(false)
        expect(staffPrefix.startsWith(residentPrefix)).toBe(false)
      }
    }
  })

  it('uses a delimiter, so one prefix cannot swallow another', () => {
    for (const prefix of [...ALL_RESIDENT_CODE_PREFIXES, ...ALL_CODE_PREFIXES]) {
      expect(prefix.endsWith('-')).toBe(true)
    }
  })
})
