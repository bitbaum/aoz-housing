/**
 * Line-art content for the art-directed product placeholder (ProductArt) —
 * one entry per PRODUCT_CATEGORY. This is icon *content*, not styling: a
 * new category is a config change here, never a new component.
 */
import type { ProductCategory } from './database'

export interface CategoryArt {
  /** The viewBox width/height the paths below are authored against. */
  viewBox: string
  /** The main silhouette — a single closed path. */
  base: string
  /** Secondary detail strokes layered over the base (laces, straps…). */
  details: string[]
}

const SHOE_VIEWBOX = '0 0 100 50'

/**
 * The sneaker wedge every footwear category builds on: a near-vertical
 * heel back, a collar curve, a long top edge over the instep, a toe that
 * curls under, and a flat sole closing the shape.
 */
const SHOE_WEDGE =
  'M4,44 L4,22 Q6,14 16,13 L44,15 Q60,17 74,22 Q88,26 96,34 Q98,38 92,42 L10,46 Q4,46 4,44 Z'

/** Inner seam line suggesting the sole's thickness. */
const SOLE_SEAM = 'M12,43 Q50,47 88,40'

export const CATEGORY_ART: Record<ProductCategory, CategoryArt> = {
  SNEAKERS: {
    viewBox: SHOE_VIEWBOX,
    base: SHOE_WEDGE,
    details: [SOLE_SEAM, 'M46,18 L56,24', 'M52,14 L61,20'],
  },
  RUNNING: {
    viewBox: SHOE_VIEWBOX,
    base: SHOE_WEDGE,
    details: [SOLE_SEAM, 'M0,26 L8,22', 'M0,34 L9,31'],
  },
  BOOTS: {
    viewBox: SHOE_VIEWBOX,
    base: SHOE_WEDGE,
    details: [SOLE_SEAM, 'M4,22 Q2,10 6,2'],
  },
  FORMAL: {
    viewBox: SHOE_VIEWBOX,
    base: SHOE_WEDGE,
    details: [SOLE_SEAM, 'M78,24 Q86,28 92,34'],
  },
  SANDALS: {
    viewBox: SHOE_VIEWBOX,
    base: 'M4,44 Q50,48 96,38',
    details: ['M26,20 L21,44', 'M50,18 L45,44', 'M74,20 L69,42'],
  },
  ACCESSORIES: {
    viewBox: '0 0 56 56',
    base: 'M10,24 L46,24 Q50,24 50,28 L50,44 Q50,48 46,48 L10,48 Q6,48 6,44 L6,28 Q6,24 10,24 Z',
    details: ['M18,24 Q18,10 28,10 Q38,10 38,24'],
  },
}
