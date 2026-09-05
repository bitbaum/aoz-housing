import { describe, expect, it } from 'vitest'

import { ResidentInputSchema } from '@/lib/validation/schemas'
import { RESIDENT_FACTORS, isEssentialFactor } from '@/lib/config/resident-factors'

/**
 * Anything the server demands, the form must ask for.
 *
 * `ResidentInputSchema` required `socialStyle` with no default, and the factor
 * lacked `intake: 'essential'` — the flag that decides whether a control is
 * rendered on the form a human actually fills. So `/residents/new` rendered no
 * control for it and EVERY submission failed. Observed on production
 * 2026-09-05: "Etwas ist schiefgelaufen", the route unmounted, all fields
 * lost. The primary way to add a person to this product could not be completed
 * by anyone — the four real clients all exist because a seed script wrote them.
 *
 * ## Why the invariant is "the schema will not invent it", not "required: true"
 *
 * Three sibling factors are ALSO `required: true` without being essential —
 * `conflictStyle`, `recyclingKnowledge`, `roomSharingStatus` — and they are
 * fine, because the schema defaults each one. "Required" in the factor config
 * means matching wants a value; the default supplies it.
 *
 * The field that breaks a form is the one the server insists on and cannot
 * invent for you. So this asks the schema behaviourally — parse an empty
 * object and see what it still complains about — rather than reading
 * `required: true` and flagging three innocents, or scanning source text.
 */

/** The keys this schema will not fill in for you, straight from zod. */
function mandatoryKeys(): string[] {
  const result = ResidentInputSchema.safeParse({})
  if (result.success) return []
  return [
    ...new Set(
      result.error.issues
        .map((issue) => issue.path[0])
        .filter((key): key is string => typeof key === 'string'),
    ),
  ]
}

describe('the intake form asks for everything the server demands', () => {
  it('renders a control for every mandatory factor', () => {
    const askedForNowhere = mandatoryKeys().filter((key) => {
      const factor = RESIDENT_FACTORS[key]
      // Not every schema key is a compatibility factor. Only factors are
      // rendered from config, so only they can go missing this way.
      return factor && !isEssentialFactor(factor)
    })

    expect(
      askedForNowhere,
      `Required by ResidentInputSchema with no default, but not ` +
        `\`intake: 'essential'\` — so the intake form renders no control and every ` +
        `submission fails on the server: ${askedForNowhere.join(', ')}. Either mark ` +
        `them essential, or give the schema a default — but a default silently ` +
        `invents an answer, which for a weighted matching factor corrupts the ` +
        `algorithm quietly rather than loudly.`,
    ).toEqual([])
  })

  it('still counts socialStyle as mandatory — the guard needs something to guard', () => {
    // Were socialStyle given a default in some later refactor, the test above
    // would pass while asserting nothing. This pins that it is still demanded.
    expect(mandatoryKeys()).toContain('socialStyle')
    expect(isEssentialFactor(RESIDENT_FACTORS.socialStyle)).toBe(true)
  })

  it('leaves the defaulted siblings out of it', () => {
    // `required: true` but defaulted — correctly NOT flagged, which is exactly
    // why the invariant is "the schema will not invent it".
    const mandatory = mandatoryKeys()
    expect(mandatory).not.toContain('conflictStyle')
    expect(mandatory).not.toContain('guestTolerance')
  })
})
