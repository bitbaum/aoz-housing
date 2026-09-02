import { syncOrgRules } from '../sync-org-rules'
import { ORG_RULE_CATALOG } from '@/lib/config/house-rules'
import { whereParts } from '@/test-utils/drizzle-where'
import type { db } from '@/lib/db'

/**
 * The catalog sync runs unattended on every cron tick, so the properties that
 * matter are: it must not duplicate, it must not reset acknowledgements for
 * rules that did not change, and it MUST invalidate them for rules that did.
 */
function makeDb(existing: Record<string, unknown> = {}) {
  const created: unknown[] = []
  const updated: { where: unknown; data: Record<string, unknown> }[] = []

  const dbMock = {
    query: {
      houseRule: {
        // Looked up by `eq(houseRule.key, …)` — the key is read back out of
        // the where-expression, same dispatch the Prisma mock did on `where.key`.
        findFirst: vi.fn(
          async ({ where }: { where: unknown }) =>
            existing[whereParts(where).key as string] ?? null,
        ),
      },
    },
    insert: () => ({
      values: vi.fn(async (data: unknown) => {
        created.push(data)
      }),
    }),
    update: () => ({
      set: (data: Record<string, unknown>) => ({
        where: async (where: unknown) => {
          updated.push({ where: whereParts(where), data })
        },
      }),
    }),
  }

  return { db: dbMock as unknown as typeof db, created, updated }
}

function seededRule(key: string, overrides: Record<string, unknown> = {}) {
  const seed = ORG_RULE_CATALOG.find((r) => r.key === key)!
  return {
    id: `id-${key}`,
    key,
    title: seed.title,
    body: seed.body,
    category: seed.category,
    delegation: seed.delegation,
    status: 'ACTIVE',
    version: 1,
    ...overrides,
  }
}

describe('syncOrgRules', () => {
  it('creates the whole catalog on an empty database', async () => {
    const { db, created } = makeDb()

    const result = await syncOrgRules(db)

    expect(result.created).toBe(ORG_RULE_CATALOG.length)
    expect(result.amended).toBe(0)
    expect(created).toHaveLength(ORG_RULE_CATALOG.length)
    expect(created.every((c) => (c as { scope: string }).scope === 'ORG')).toBe(true)
  })

  it('is idempotent — a second run changes nothing', async () => {
    const existing = Object.fromEntries(ORG_RULE_CATALOG.map((r) => [r.key, seededRule(r.key)]))
    const { db, created, updated } = makeDb(existing)

    const result = await syncOrgRules(db)

    expect(result.created).toBe(0)
    expect(result.amended).toBe(0)
    expect(result.unchanged).toBe(ORG_RULE_CATALOG.length)
    expect(created).toHaveLength(0)
    expect(updated).toHaveLength(0)
  })

  it('bumps the version when wording changes, so everyone re-acknowledges', async () => {
    const key = ORG_RULE_CATALOG[0].key
    const existing = Object.fromEntries(
      ORG_RULE_CATALOG.map((r) => [
        r.key,
        seededRule(r.key, r.key === key ? { body: 'Alter Text, der ersetzt wird.' } : {}),
      ]),
    )
    const { db, updated } = makeDb(existing)

    const result = await syncOrgRules(db)

    expect(result.amended).toBe(1)
    expect(result.amendedKeys).toEqual([key])
    expect(updated).toHaveLength(1)
    expect(updated[0].data.version).toBe(2)
  })

  it('does not invalidate acknowledgements for a purely non-textual change', async () => {
    // Re-categorising a rule does not change what a resident agreed to, so it
    // must not force the whole house to confirm everything again.
    const key = ORG_RULE_CATALOG[0].key
    const existing = Object.fromEntries(
      ORG_RULE_CATALOG.map((r) => [
        r.key,
        seededRule(r.key, r.key === key ? { category: 'OTHER' } : {}),
      ]),
    )
    const { db, updated } = makeDb(existing)

    const result = await syncOrgRules(db)

    expect(result.amended).toBe(0)
    expect(updated).toHaveLength(1)
    expect(updated[0].data.version).toBe(1)
  })

  it('reactivates a rule that was archived out of band', async () => {
    const key = ORG_RULE_CATALOG[0].key
    const existing = Object.fromEntries(
      ORG_RULE_CATALOG.map((r) => [
        r.key,
        seededRule(r.key, r.key === key ? { status: 'ARCHIVED' } : {}),
      ]),
    )
    const { db, updated } = makeDb(existing)

    await syncOrgRules(db)

    expect(updated).toHaveLength(1)
    expect(updated[0].data.status).toBe('ACTIVE')
  })

  it('keeps catalog keys unique — they are the stable identity of a rule', () => {
    const keys = ORG_RULE_CATALOG.map((r) => r.key)
    expect(new Set(keys).size).toBe(keys.length)
  })
})
