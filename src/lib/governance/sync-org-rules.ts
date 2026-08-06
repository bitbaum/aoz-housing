/**
 * Syncing the AOZ baseline catalog into the database.
 *
 * The ORG tier is reference data, not demo data — it must exist in production
 * as much as in a dev seed. This sync is idempotent and keyed on the rule
 * `key`, so it can be run on every deploy.
 *
 * When a rule's wording changes, the version is bumped. That is deliberate:
 * acknowledgements are per version, so amending an AOZ rule asks every resident
 * to read it again. Changing a rule's text without re-asking would leave people
 * bound to wording they never saw.
 */

import type { PrismaClient } from '@prisma/client'
// Relative rather than the usual '@/' alias: prisma/seed.ts imports this module
// through ts-node, which does not resolve tsconfig path aliases.
import { ORG_RULE_CATALOG } from '../config/house-rules'

export interface SyncResult {
  created: number
  amended: number
  unchanged: number
  /** Keys that changed wording — these now require re-acknowledgement. */
  amendedKeys: string[]
}

export async function syncOrgRules(prisma: PrismaClient): Promise<SyncResult> {
  const result: SyncResult = { created: 0, amended: 0, unchanged: 0, amendedKeys: [] }

  for (const seed of ORG_RULE_CATALOG) {
    const existing = await prisma.houseRule.findUnique({ where: { key: seed.key } })

    if (!existing) {
      await prisma.houseRule.create({
        data: {
          scope: 'ORG',
          key: seed.key,
          category: seed.category,
          title: seed.title,
          body: seed.body,
          delegation: seed.delegation,
          status: 'ACTIVE',
          version: 1,
        },
      })
      result.created++
      continue
    }

    const contentChanged = existing.title !== seed.title || existing.body !== seed.body
    const metaChanged =
      existing.category !== seed.category ||
      existing.delegation !== seed.delegation ||
      existing.status !== 'ACTIVE'

    if (!contentChanged && !metaChanged) {
      result.unchanged++
      continue
    }

    await prisma.houseRule.update({
      where: { id: existing.id },
      data: {
        category: seed.category,
        title: seed.title,
        body: seed.body,
        delegation: seed.delegation,
        status: 'ACTIVE',
        // Only new wording invalidates an acknowledgement. Re-categorising a
        // rule does not change what a resident agreed to, so it must not
        // trigger a re-acknowledgement round for everyone.
        version: contentChanged ? existing.version + 1 : existing.version,
      },
    })

    if (contentChanged) {
      result.amended++
      result.amendedKeys.push(seed.key)
    } else {
      result.unchanged++
    }
  }

  return result
}
