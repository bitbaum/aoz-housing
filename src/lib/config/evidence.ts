/**
 * How this product cites evidence — shared by every domain that claims one.
 *
 * The housing side has documented its scientific basis since the beginning:
 * which factor is weighted, why, and what research says so. Job integration
 * had none, which is not a small asymmetry — placement and employment are the
 * two things AOZ is measured on, and only one of them could explain itself.
 *
 * These types live here rather than in `algorithm-docs.ts` so the second
 * domain does not import the first's module for a type it merely shares.
 * `algorithm-docs.ts` re-exports them, so no existing import path changes.
 */

/**
 * How much weight a claim carries.
 *
 * Deliberately three levels, not a number. A false precision — "0.82
 * confidence" — invites the reader to compute with it, and none of this is
 * meta-analysed to that resolution.
 */
export type EvidenceStrength = 'strong' | 'moderate' | 'preliminary'

/**
 * Where a claim comes from.
 *
 * `region` is not decoration. Swiss and German labour-market findings are the
 * ones that transfer to AOZ's setting, because the institutions differ:
 * permit regimes, recognition procedures and the structure of vocational
 * training are not portable, and an American supported-employment trial can be
 * strong evidence for a mechanism while saying nothing about a Swiss process.
 * Sorting CH/DE ahead of INT is how the reader sees that at a glance.
 */
export interface ResearchSource {
  id: string
  title: string
  authors?: string
  year?: number
  publication?: string
  url?: string
  /** Switzerland, Germany/Austria, International. */
  region: 'CH' | 'DE' | 'INT'
  keyFindings: string[]
  evidenceStrength: EvidenceStrength
}
