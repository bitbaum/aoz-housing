/**
 * Shared-expenses configuration — SSOT
 *
 * Categories are config, not a Prisma enum, so adding one is a config change
 * (this file only), never a migration. The DB stores the id string and the
 * Zod schema in lib/validation/expenses.ts is derived from this list.
 */

export interface ExpenseCategory {
  id: string
  label: string
}

export const EXPENSE_CATEGORIES = [
  { id: 'GROCERIES', label: 'Einkauf' },
  { id: 'HOUSEHOLD', label: 'Haushalt & Putzmittel' },
  { id: 'INTERNET', label: 'Internet & TV' },
  { id: 'UTILITIES', label: 'Nebenkosten' },
  { id: 'FURNITURE', label: 'Einrichtung' },
  { id: 'LEISURE', label: 'Freizeit & Gemeinsames' },
  { id: 'OTHER', label: 'Sonstiges' },
] as const satisfies readonly ExpenseCategory[]

export type ExpenseCategoryId = (typeof EXPENSE_CATEGORIES)[number]['id']

export const EXPENSE_CATEGORY_IDS = EXPENSE_CATEGORIES.map((c) => c.id) as [
  ExpenseCategoryId,
  ...ExpenseCategoryId[],
]

export function expenseCategoryLabel(id: string): string {
  return EXPENSE_CATEGORIES.find((c) => c.id === id)?.label ?? id
}

export const EXPENSE_LIMITS = {
  /** CHF 10'000 — sanity ceiling against typos, not a policy. */
  maxAmountRappen: 1_000_000,
  maxDescriptionLength: 200,
  maxNoteLength: 200,
} as const
