/**
 * The living-together half of the demo world: chores, decisions, maintenance.
 *
 * Without this, the demo tour renders three empty pages — "Noch keine
 * Aufgaben", "Zurzeit steht nichts zur Abstimmung", "Keine Wartungsanfragen" —
 * and a visitor concludes those features do not exist. The expense and rule
 * surfaces were seeded; the governance ones were not.
 *
 * The timing matters more than the content. A proposal created today sits in
 * DISCUSSION for three days before voting opens, and the demo world is wiped
 * every night — so a freshly-created proposal can NEVER reach a vote in a demo.
 * Everything here is therefore backdated: the vote is already open, one seat is
 * deliberately left empty, and the demo visitor casts the deciding ballot.
 *
 * Relative-import-safe (no '@/' aliases): loaded through ts-node.
 */

import type { PrismaClient } from '@prisma/client'
import {
  CATEGORY_DECISION_MODE,
  CATEGORY_THRESHOLD,
  DECISION_TIMING,
  THRESHOLD_APPROVAL_PERCENT,
} from '../config/decisions'
import { tallyVotes } from '../governance/voting'
import { BRAND } from '../config/brand'
import { getDateDaysAgo } from '../utils/formatting'

const daysAgo = getDateDaysAgo
const daysAhead = (days: number) => getDateDaysAgo(-days)

/**
 * `daysAgo` for anything the CURRENT MONTH's chore balance must contain.
 *
 * The demo world is rebuilt nightly and the balance panel is scoped to the
 * calendar month, so on the 2nd of a month a plain `daysAgo(11)` lands in the
 * previous month and the panel a visitor came to see renders empty. Dates that
 * would fall out of the month are pulled to just after its start instead, which
 * keeps the record uneven — the point of the panel — on every single day.
 */
const daysAgoThisMonth = (days: number): Date => {
  const target = daysAgo(days)
  const now = new Date()
  if (target.getMonth() === now.getMonth() && target.getFullYear() === now.getFullYear()) {
    return target
  }
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 9, 0, 0)
  // Keep the relative ordering of the seeded history: a larger `days` stays older.
  return new Date(Math.min(monthStart.getTime() + (30 - days) * 60 * 1000, now.getTime()))
}

export interface DemoGovernanceContext {
  /** The success unit — the one the demo resident lives in. */
  unitId: string
  /** The demo resident (Fatima) — deliberately left without a vote to cast. */
  demoResidentId: string
  /** Their roommates, who have already voted. */
  roommateIds: [string, string, string]
}

/** Policy snapshot for a category, taken as it would be when voting opens. */
function snapshotFor(category: 'NOISE' | 'KITCHEN' | 'CLEANLINESS' | 'SAFETY', voters: number) {
  const threshold = CATEGORY_THRESHOLD[category]
  return {
    decisionMode: CATEGORY_DECISION_MODE[category],
    threshold,
    quorumPercent: DECISION_TIMING.quorumPercent,
    approvalPercent: THRESHOLD_APPROVAL_PERCENT[threshold],
    eligibleVoterCount: voters,
  }
}

export async function seedDemoGovernance(
  prisma: PrismaClient,
  ctx: DemoGovernanceContext
): Promise<void> {
  const { unitId, demoResidentId, roommateIds } = ctx
  const [yasmin, amira, sara] = roommateIds
  const voters = roommateIds.length + 1

  // ==========================================================================
  // HOUSEHOLD TASKS — the chore board, with a fairness record behind it
  // ==========================================================================
  // Completion counts are uneven on purpose: an even board shows nothing, while
  // "who has actually been doing this" is the conversation the page exists for.
  const kitchen = await prisma.householdTask.create({
    data: {
      housingUnitId: unitId,
      createdByResidentId: demoResidentId,
      title: 'Küche putzen',
      description: 'Abfläche, Herd und Spüle. Kühlschrank einmal im Monat.',
      taskType: 'RECURRING_SCHEDULED',
      category: 'CLEANING',
      priority: 'NORMAL',
      scheduleHuman: 'Jeden Samstag',
      estimatedMinutes: 30,
      currentStatus: 'IDLE',
      checklist: [
        'Spüle leer, nichts steht mehr drin',
        'Herd abgewischt',
        'Arbeitsflächen abgewischt',
        'Boden gewischt',
      ],
      // A rota so the demo shows whose turn it is; the order is just the house.
      rotationResidentIds: [demoResidentId, yasmin, amira, sara],
    },
  })

  const trash = await prisma.householdTask.create({
    data: {
      housingUnitId: unitId,
      createdByResidentId: yasmin,
      title: 'Abfall und Recycling rausbringen',
      description: 'Abfallsack am Dienstagabend, Karton und PET nach Bedarf.',
      taskType: 'RECURRING_AS_NEEDED',
      category: 'TRASH',
      priority: 'NORMAL',
      estimatedMinutes: 10,
      // Someone flagged it — the board shows an open call for help, not a
      // uniform list where nothing ever needs doing.
      currentStatus: 'NEEDS_ATTENTION',
      checklist: ['Sack zum Container gebracht', 'Neuer Sack eingesetzt'],
    },
  })

  const bathroom = await prisma.householdTask.create({
    data: {
      housingUnitId: unitId,
      createdByResidentId: amira,
      title: 'Bad putzen',
      description: 'Dusche, WC und Lavabo. Handtücher wechseln.',
      taskType: 'RECURRING_SCHEDULED',
      category: 'CLEANING',
      priority: 'NORMAL',
      scheduleHuman: 'Jeden Mittwoch',
      estimatedMinutes: 25,
      currentStatus: 'IDLE',
      checklist: [
        'WC innen und aussen gereinigt',
        'Lavabo und Spiegel gewischt',
        'Dusche ausgespült',
        'Boden gewischt',
        'Handtücher gewechselt',
      ],
      rotationResidentIds: [amira, demoResidentId, yasmin],
    },
  })

  // Minutes, not row counts, are what the balance panel reads — so the seeded
  // record is uneven in TIME as well as in count. Sara has done nothing this
  // month and sits visibly behind; that gap is the conversation the panel is
  // for, and an even board would show a visitor nothing at all.
  const kitchenItems = kitchen.checklist
  const bathItems = bathroom.checklist
  const trashItems = trash.checklist

  await prisma.taskCompletion.createMany({
    data: [
      { taskId: kitchen.id, completedById: demoResidentId, completedAt: daysAgoThisMonth(2), durationMinutes: 35, completedItems: kitchenItems },
      { taskId: kitchen.id, completedById: yasmin, completedAt: daysAgoThisMonth(9), durationMinutes: 30, completedItems: kitchenItems },
      { taskId: bathroom.id, completedById: demoResidentId, completedAt: daysAgoThisMonth(4), durationMinutes: 20, completedItems: bathItems },
      // A deliberately PARTIAL completion: the floor and the towels were left.
      // "Erledigt" with two items unticked is exactly the situation the
      // checklist exists to make visible instead of arguable.
      { taskId: bathroom.id, completedById: amira, completedAt: daysAgoThisMonth(11), durationMinutes: 25, completedItems: bathItems.slice(0, 3) },
      { taskId: trash.id, completedById: yasmin, completedAt: daysAgoThisMonth(3), durationMinutes: 10, completedItems: trashItems },
      { taskId: trash.id, completedById: demoResidentId, completedAt: daysAgoThisMonth(10), durationMinutes: 10, completedItems: trashItems },
    ],
  })

  await prisma.taskAttentionFlag.create({
    data: {
      taskId: trash.id,
      flaggedById: sara,
      message: 'Der Abfallsack ist voll — kann das jemand heute noch rausbringen?',
      createdAt: daysAgo(1),
    },
  })

  // ==========================================================================
  // PROPOSALS — one at each stage a resident can actually learn something from
  // ==========================================================================

  // 1. VOTING, and the demo visitor holds the deciding vote.
  //    Backdated so the discussion window has genuinely elapsed; without that
  //    the vote buttons refuse ("Die Abstimmung hat noch nicht begonnen") and
  //    the single most important screen in the tour is unreachable.
  await prisma.proposal.create({
    data: {
      housingUnitId: unitId,
      type: 'HOUSE_DECISION',
      category: 'KITCHEN',
      title: 'Abwasch am selben Abend',
      body:
        'Wer kocht, wäscht am selben Abend ab. Das Geschirr bleibt nicht über Nacht stehen, ' +
        'damit die Küche am Morgen für alle nutzbar ist.',
      proposedByResidentId: yasmin,
      status: 'VOTING',
      ...snapshotFor('KITCHEN', voters),
      createdAt: daysAgo(5),
      discussionEndsAt: daysAgo(2),
      votingOpenedAt: daysAgo(2),
      votingEndsAt: daysAhead(5),
      votes: {
        create: [
          { residentId: yasmin, choice: 'YES', castAt: daysAgo(2) },
          { residentId: amira, choice: 'YES', castAt: daysAgo(1) },
          // Sara is against; Fatima — the demo login — has not voted yet.
          { residentId: sara, choice: 'NO', reason: 'Nach der Spätschicht schaffe ich das nicht immer.', castAt: daysAgo(1) },
        ],
      },
    },
  })

  // 2. DISCUSSION — still being talked about, voting has not opened.
  await prisma.proposal.create({
    data: {
      housingUnitId: unitId,
      type: 'HOUSE_DECISION',
      category: 'SHARED_SPACES',
      title: 'Pflanzen im Wohnzimmer',
      body:
        'Wir stellen ein paar Pflanzen ins Wohnzimmer und teilen das Giessen auf. ' +
        'Kosten ca. CHF 40, aus der gemeinsamen Kasse.',
      proposedByResidentId: amira,
      status: 'DISCUSSION',
      decisionMode: CATEGORY_DECISION_MODE.SHARED_SPACES,
      threshold: CATEGORY_THRESHOLD.SHARED_SPACES,
      quorumPercent: DECISION_TIMING.quorumPercent,
      approvalPercent: THRESHOLD_APPROVAL_PERCENT[CATEGORY_THRESHOLD.SHARED_SPACES],
      eligibleVoterCount: voters,
      createdAt: daysAgo(1),
      discussionEndsAt: daysAhead(2),
      votingEndsAt: daysAhead(9),
    },
  })

  // 3. ACCEPTED — a decision the house already took, with the house rule it
  //    produced. The outcome text is computed by the real tally function, never
  //    written by hand: a demo that explains a result differently from the
  //    product is a demo of something that does not exist.
  const quietVotes = [
    { residentId: demoResidentId, choice: 'YES' as const },
    { residentId: yasmin, choice: 'YES' as const },
    { residentId: amira, choice: 'YES' as const },
    { residentId: sara, choice: 'ABSTAIN' as const },
  ]
  const quietSnapshot = snapshotFor('NOISE', voters)
  const quietTally = tallyVotes({
    votes: quietVotes,
    eligibleVoterCount: quietSnapshot.eligibleVoterCount,
    threshold: quietSnapshot.threshold,
    quorumPercent: quietSnapshot.quorumPercent,
    approvalPercent: quietSnapshot.approvalPercent,
  })

  const nightQuiet = await prisma.houseRule.findUnique({ where: { key: 'night_quiet' } })

  const quietProposal = await prisma.proposal.create({
    data: {
      housingUnitId: unitId,
      type: 'ADD_RULE',
      category: 'NOISE',
      title: 'Ruhe ab 21:30 statt 22:00',
      body:
        'Wir ziehen die Nachtruhe eine halbe Stunde vor. Ab 21:30 keine Musik ohne Kopfhörer ' +
        'und keine Waschmaschine mehr.',
      parentOrgRuleId: nightQuiet?.id ?? null,
      proposedByResidentId: demoResidentId,
      status: 'ACCEPTED',
      ...quietSnapshot,
      createdAt: daysAgo(24),
      discussionEndsAt: daysAgo(21),
      votingOpenedAt: daysAgo(21),
      votingEndsAt: daysAgo(14),
      decidedAt: daysAgo(14),
      outcomeSummary: quietTally.explanation,
      votes: { create: quietVotes.map((v) => ({ ...v, castAt: daysAgo(18) })) },
    },
  })

  if (nightQuiet) {
    await prisma.houseRule.create({
      data: {
        scope: 'UNIT',
        housingUnitId: unitId,
        parentRuleId: nightQuiet.id,
        category: 'NOISE',
        title: 'Ruhe ab 21:30',
        body:
          'In dieser Wohnung beginnt die Ruhezeit um 21:30 Uhr — eine halbe Stunde früher als ' +
          `die ${BRAND.orgName}-Regel verlangt. Beschlossen von den Bewohnenden am ` +
          `${daysAgo(14).toLocaleDateString('de-CH')}.`,
        status: 'ACTIVE',
        version: 1,
        adoptedByProposalId: quietProposal.id,
      },
    })
  }

  // 4. NEEDS_STAFF_CONFIRMATION — safety is never put to a vote, but the house
  //    must still be answered. This is also what fills the staff decision queue,
  //    which is otherwise empty in the staff tour.
  await prisma.proposal.create({
    data: {
      housingUnitId: unitId,
      type: 'HOUSE_DECISION',
      category: 'SAFETY',
      title: 'Zweiter Schlüssel für den Veloraum',
      body:
        'Es gibt nur einen Schlüssel für den Veloraum. Wir hätten gern einen zweiten, ' +
        'damit nicht immer dieselbe Person aufschliessen muss.',
      proposedByResidentId: sara,
      status: 'NEEDS_STAFF_CONFIRMATION',
      ...snapshotFor('SAFETY', voters),
      createdAt: daysAgo(3),
      outcomeSummary:
        'Sicherheitsthemen werden nicht abgestimmt. Die Betreuung beantwortet den Vorschlag.',
    },
  })

  // ==========================================================================
  // MAINTENANCE — the board staff work, seen from the resident side too
  // ==========================================================================
  await prisma.maintenanceRequest.create({
    data: {
      housingUnitId: unitId,
      reportedById: demoResidentId,
      category: 'PLUMBING',
      priority: 'NORMAL',
      title: 'Sanitär',
      description: 'Der Wasserhahn im Bad tropft, auch wenn er ganz zugedreht ist.',
      location: 'Bad',
      status: 'IN_PROGRESS',
      assignedTo: 'Hauswart',
      assignedAt: daysAgo(2),
      startedAt: daysAgo(1),
      createdAt: daysAgo(3),
    },
  })

  // Reported by the DEMO LOGIN and already answered, so the tour shows the one
  // thing a resident actually wants from reporting something: a reply. An
  // answered request belonging to a roommate proves nothing to the visitor.
  await prisma.maintenanceRequest.create({
    data: {
      housingUnitId: unitId,
      reportedById: demoResidentId,
      category: 'HEATING_COOLING',
      priority: 'NORMAL',
      title: 'Heizung/Klima',
      description: 'Die Heizung im Zimmer wird nur oben warm.',
      location: 'Zimmer',
      status: 'COMPLETED',
      assignedTo: 'Hauswart',
      completedAt: daysAgo(6),
      resolution: 'Heizkörper entlüftet. Bitte melden, falls es wieder auftritt.',
      createdAt: daysAgo(12),
    },
  })

  await prisma.maintenanceRequest.create({
    data: {
      housingUnitId: unitId,
      reportedById: sara,
      category: 'APPLIANCE',
      priority: 'HIGH',
      title: 'Gerät defekt',
      description: 'Die Waschmaschine schleudert nicht mehr und bleibt mitten im Programm stehen.',
      location: 'Waschküche',
      status: 'OPEN',
      createdAt: daysAgo(1),
    },
  })

  await prisma.maintenanceRequest.create({
    data: {
      housingUnitId: unitId,
      reportedById: yasmin,
      category: 'ELECTRICAL',
      priority: 'NORMAL',
      title: 'Elektrik',
      description: 'Das Licht im Korridor flackert.',
      location: 'Korridor',
      status: 'COMPLETED',
      assignedTo: 'Hauswart',
      completedAt: daysAgo(5),
      // The answer travels back to the resident who reported it.
      resolution: 'Leuchtmittel und Starter ersetzt. Bitte melden, falls es erneut flackert.',
      createdAt: daysAgo(9),
    },
  })
}
