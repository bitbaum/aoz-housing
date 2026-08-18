/**
 * Fixed sustainability-feature vocabulary — a checkbox list, not free text,
 * so the catalog stays consistent and searchable instead of drifting into
 * typos and near-duplicate tags.
 */
export const SUSTAINABILITY_FEATURES = [
  'Eco-friendly materials',
  'Recycled components',
  'Vegan materials',
  'Carbon neutral shipping',
  'Locally sourced',
  'Refurbished/Restored',
  'Biodegradable packaging',
  'Fair trade certified',
] as const

export type SustainabilityFeature = (typeof SUSTAINABILITY_FEATURES)[number]
