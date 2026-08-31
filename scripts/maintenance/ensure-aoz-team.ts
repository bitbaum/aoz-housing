/**
 * Provision the real AOZ team, idempotently.
 *
 * Reads `prisma/real/aoz-team.ts` and makes the database match it. Safe to run
 * repeatedly: an existing person is matched by name and UPDATED to the shape
 * the config declares, so this doubles as the way to correct someone's reach
 * after the fact. A code is minted only for someone who does not exist yet,
 * and it is printed ONCE — this script is the only time anybody sees it.
 *
 * Usage (from repo root, against the target DB env):
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/maintenance/ensure-aoz-team.ts
 *
 * Add DRY_RUN=1 to see what it would do without writing.
 */

import { PrismaClient } from '@prisma/client'
import { AOZ_TEAM } from '../../prisma/real/aoz-team'
import { generateStaffCode } from '../../src/lib/auth/code-generation'
import { CARE_ROLES, CARE_ROLE_LABELS, STAFF_ROLE_CARE_DOMAIN } from '../../src/lib/config/care'

const prisma = new PrismaClient()
const DRY_RUN = process.env.DRY_RUN === '1'

async function uniqueStaffCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateStaffCode()
    if (!(await prisma.user.findUnique({ where: { code }, select: { id: true } }))) {
      return code
    }
  }
  throw new Error('could not generate a unique staff code')
}

async function main() {
  const minted: { name: string; code: string }[] = []

  for (const person of AOZ_TEAM) {
    const capabilities = {
      role: person.role,
      scope: person.scope,
      isSystemAdmin: person.isSystemAdmin,
    }

    const existing = await prisma.user.findFirst({
      where: { name: person.name },
      select: { id: true, code: true, role: true, scope: true, isSystemAdmin: true, active: true },
    })

    if (existing) {
      const drifted =
        existing.role !== person.role ||
        existing.scope !== person.scope ||
        existing.isSystemAdmin !== person.isSystemAdmin ||
        !existing.active

      if (!drifted) {
        console.log(`= ${person.name} (${existing.code}) already matches the config`)
        continue
      }
      console.log(
        `~ ${person.name} (${existing.code}): ${existing.role}/${existing.scope}` +
          `${existing.isSystemAdmin ? '/admin' : ''}` +
          ` -> ${person.role}/${person.scope}${person.isSystemAdmin ? '/admin' : ''}`,
      )
      if (!DRY_RUN) {
        await prisma.user.update({
          where: { id: existing.id },
          data: { ...capabilities, active: true },
        })
      }
      continue
    }

    const code = DRY_RUN ? '<generated at run time>' : await uniqueStaffCode()
    console.log(`+ ${person.name}: ${person.role}/${person.scope}`)
    if (!DRY_RUN) {
      await prisma.user.create({
        data: { code, name: person.name, ...capabilities, active: true },
      })
      minted.push({ name: person.name, code })
    }
  }

  // Which care seats nobody is staffed for. AOZ has no Sozialarbeit person, so
  // this is expected to report SOCIAL — but reporting it is the point: an
  // unstaffed seat is a fact somebody should know, not an empty column that
  // quietly looks the same as a staffed one nobody has used yet.
  const staffedDomains = new Set(AOZ_TEAM.map((p) => STAFF_ROLE_CARE_DOMAIN[p.role]))
  const covers = AOZ_TEAM.filter((p) => p.scope === 'ALL_DOMAINS').map((p) => p.name)
  const unstaffed = CARE_ROLES.filter((domain) => !staffedDomains.has(domain))

  console.log('')
  for (const person of AOZ_TEAM) console.log(`  ${person.name} — ${person.note}`)

  if (unstaffed.length > 0) {
    console.log('')
    console.log(
      `Kein eigenes Personal für: ${unstaffed.map((d) => CARE_ROLE_LABELS[d]).join(', ')}`,
    )
    console.log(
      covers.length > 0
        ? `  abgedeckt durch: ${covers.join(', ')} (ALL_DOMAINS)`
        : '  NIEMAND deckt diese Bereiche ab — Anfragen dort landen bei niemandem.',
    )
  }

  if (minted.length > 0) {
    console.log('')
    console.log('Login-Codes — EINMALIG angezeigt, nirgends gespeichert:')
    for (const { name, code } of minted) console.log(`  ${name}: ${code}`)
    console.log('')
    console.log('Diese Codes persönlich weitergeben und danach dieses Terminal schliessen.')
  }

  if (DRY_RUN) console.log('\n(DRY_RUN=1 — nichts geschrieben)')
}

main()
  .catch((e) => {
    console.error('ensure-aoz-team failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
