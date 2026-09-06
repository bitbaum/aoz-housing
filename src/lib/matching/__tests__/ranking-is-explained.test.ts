import { readFileSync } from 'fs'
import { join } from 'path'

import { describe, expect, it } from 'vitest'

import { describeRankingFactor } from '@/lib/matching/describe-ranking'
import { RANKING_FACTOR_IDS, type RankingFactor } from '@/lib/matching/ranking'

/**
 * The order of the match list has to be readable.
 *
 * `/algorithm` documents the compatibility dimensions and their weights, and
 * the card prints a percentage — but the LIST ORDER is what staff act on, and
 * it was computed by an eleven-term expression buried in a page component that
 * no surface explained and no test pinned.
 *
 * It is not the same number as the one on the card: the ranking's stand-in for
 * fit is the ROOM score wherever a room can be scored, while the card
 * headlines the APARTMENT score. So a unit can rank above another whose
 * printed numbers look better, with nothing on the page accounting for it.
 *
 *   "Transparency — decisions must be explainable. No black-box algorithms."
 *
 * A placement is the most consequential thing this product does. Ranking one
 * home above another is the decision; the score is only an input to it.
 */

const ROOT = join(__dirname, '..', '..', '..', '..')

/**
 * Source with every comment removed — line, block, and JSX.
 *
 * Three times in this session a source gate has been satisfied by its own
 * documentation: by the comment explaining the fix, by the prose naming the
 * subject, by the docstring quoting the symbol. The subject of a check must
 * never be part of what the check reads.
 */
function sourceOf(relative: string): string {
  return readFileSync(join(ROOT, relative), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .map((line) => line.replace(/\/\/.*$/, ''))
    .join('\n')
}

describe('every ranking factor has words', () => {
  it.each(RANKING_FACTOR_IDS)('%s renders a sentence', (id) => {
    const factor: RankingFactor = {
      id,
      impact: 10,
      detail: 2,
      riskLevel: 'HIGH',
      fitIsRoom: true,
    }
    const text = describeRankingFactor(factor)
    expect(text.trim().length).toBeGreaterThan(0)
    // A factor that renders as a bare number explains nothing.
    expect(text).toMatch(/\p{Letter}/u)
  })

  it('names the room score and the apartment score differently', () => {
    // This is the disclosure that matters most: which percentage did the
    // ranking. If both read the same, the divergence stays invisible.
    const base = { id: 'fit', impact: -70, detail: 70 } as const
    const room = describeRankingFactor({ ...base, fitIsRoom: true })
    const apartment = describeRankingFactor({ ...base, fitIsRoom: false })
    expect(room).not.toBe(apartment)
  })

  it('uses Swiss spelling', () => {
    for (const id of RANKING_FACTOR_IDS) {
      expect(describeRankingFactor({ id, impact: 1, detail: 1, riskLevel: 'HIGH' })).not.toMatch(
        /ß/,
      )
    }
  })
})

describe('the surfaces are wired', () => {
  it('the match card renders the explanation', () => {
    const card = sourceOf('src/components/matching/MatchCard.tsx')
    // The CALL, not the word — a mention in prose is not a render.
    expect(card).toMatch(/describeRankingFactor\(/)
    expect(card).toMatch(/match\.rankingFactors/)
  })

  it('the matching page computes the factors it sorts by', () => {
    const page = sourceOf('src/app/(admin)/matching/page.tsx')
    expect(page).toMatch(/rankingFactors\(/)
    expect(page).toMatch(/rankingScore\(/)
  })

  it('the page no longer carries its own copy of the arithmetic', () => {
    // The weights live in lib/matching/ranking.ts, pinned there against the
    // original expression. A second copy in the page is how the shown reasons
    // and the real order drift apart.
    const page = sourceOf('src/app/(admin)/matching/page.tsx')
    expect(page).not.toMatch(/hasBlockingIssue \? 1000 : 0/)
    expect(page).not.toMatch(/unitRiskPenalty/)
  })
})
