import type { ApplicationStageId } from '@/lib/config/opportunities'
import type { LearningKindId, LearningStatusId } from '@/lib/config/learning'

/**
 * What a job coach has waiting — derived from evidence, not invented.
 *
 * ## The bug this exists to fix
 *
 * The dashboard decides "busy" or "quiet" from `openTaskCount`, and every
 * component of that count was a housing queue: overdue check-ins, unplaced
 * residents, pending transfers, problem units, governance proposals. A
 * Jobcoach holds none of those permissions, so the count was structurally
 * always zero.
 *
 * Observed in production on 2026-09-02: Simon B. had a client assigned that
 * same day — job-seeking, two years without work, an unrecognised trade
 * qualification, German at A2 — and his dashboard said
 * "🎉 Alles unter Kontrolle! Keine dringenden Aufgaben", without naming him.
 *
 * That is the same failure the `unassigned` state was added to fix, one level
 * deeper. Then it was "nobody is assigned to me". Now it is "somebody is, with
 * real work outstanding, and the queue cannot see it" — because the queue was
 * defined in another domain's vocabulary.
 *
 * ## Why these four signals and not others
 *
 * Each maps to a principle in `config/job-integration-docs.ts` marked
 * `status: 'signal'`. Nothing here is a hunch:
 *
 *  - INTEREST_UNANSWERED — client preference first. A resident who pressed
 *    "Ich habe Interesse" has stated the one thing IPS says predicts retention,
 *    and is now waiting for a person to reply.
 *  - NO_LABOUR_MARKET_CONTACT — place-then-train. Rapid entry into real work
 *    beats lengthy pre-training, so a client with no application and no active
 *    placement is an open task rather than a neutral state.
 *  - COURSE_WITHOUT_WORK — language and work in parallel, not sequential. A
 *    running course with no labour-market contact is exactly the lock-in
 *    pattern the IAB evidence describes, where search intensity falls during a
 *    measure.
 *  - STALLED_RECORD — an IN_PROGRESS record nobody has touched. Not a
 *    judgement about the person; a record that has stopped moving is a record
 *    nobody is working.
 *
 * Principles marked `documented` deliberately raise nothing: qualification
 * recognition, post-start support and stated job goals all matter, and the
 * product cannot currently detect them. Inventing a signal from data that does
 * not exist would be worse than the gap.
 *
 * Pure. No Prisma, no dates read from the clock — `now` is passed in, so the
 * same input always produces the same queue.
 */

export const JOB_SIGNAL_IDS = [
  'INTEREST_UNANSWERED',
  'NO_LABOUR_MARKET_CONTACT',
  'COURSE_WITHOUT_WORK',
  'STALLED_RECORD',
] as const

export type JobSignalId = (typeof JOB_SIGNAL_IDS)[number]

/**
 * How long a record may sit untouched before it counts as stalled.
 *
 * Six weeks, not two: a language course legitimately runs for months without
 * an update, and a queue that fires every fortnight is one a coach learns to
 * dismiss. The number is a threshold to argue with, which is why it is here
 * and not buried in a comparison.
 */
export const STALLED_RECORD_DAYS = 42

/**
 * How long after intake a client with no labour-market contact is overdue.
 *
 * The evidence says early contact predicts the later trajectory, and that long
 * initial unemployment leaves a scar. It does not say "fourteen days" — that
 * is a working default, deliberately short enough to be noticed and long
 * enough that intake week is not immediately an alarm.
 */
export const NO_CONTACT_GRACE_DAYS = 14

/** Work kinds. A started application of one of these IS labour-market contact. */
const WORK_KINDS: readonly LearningKindId[] = ['EMPLOYMENT', 'INTERNSHIP']

/** Application stages that mean a real process is running. */
const LIVE_STAGES: readonly ApplicationStageId[] = [
  'INTERESTED',
  'APPLIED',
  'INTERVIEW',
  'ACCEPTED',
  'STARTED',
]

/**
 * An application as every measure of labour-market contact reads it.
 *
 * `createdBy` and `supportedByUserId` are not decoration. Together they answer
 * the only question that separates contact from a request for contact: did a
 * person on the staff side ever engage with this thread?
 */
export interface JobApplicationInput {
  stage: ApplicationStageId
  /** Who opened this thread — the resident themselves, or a member of staff. */
  createdBy: 'RESIDENT' | 'STAFF'
  /** null = nobody on the staff side has picked it up. */
  supportedByUserId: string | null
}

export interface JobClientInput {
  residentId: string
  /** For display. Never a bare code — see utils/resident-name. */
  name: string
  /** When this person entered the register. */
  createdAt: Date
  learningRecords: {
    kind: LearningKindId
    status: LearningStatusId
    updatedAt: Date
  }[]
  applications: JobApplicationInput[]
}

export interface JobQueueItem {
  residentId: string
  name: string
  signal: JobSignalId
}

/**
 * A resident put their hand up and nobody has answered.
 *
 * ## The inversion this ends
 *
 * `hasLiveApplication` counted INTERESTED as labour-market contact, and
 * `recordInterest` writes precisely that row — resident-created, INTERESTED,
 * `supportedByUserId` null — when somebody presses "Ich habe Interesse" in the
 * portal. Nothing anywhere read `supportedByUserId`.
 *
 * So the single action a resident can take on this board REMOVED them from
 * their coach's queue and RAISED `LABOUR_MARKET_CONTACT_RATE`, without one
 * member of staff having done anything. The person most in need of a reply
 * became the person the product had stopped mentioning, and the metric moved
 * in the right direction while the work went undone.
 *
 * That is the same class of error as counting demo rows in the pilot KPI, from
 * the opposite side: there the numerator held rows nobody was working; here it
 * held rows nobody had answered.
 *
 * Contact means a person engaged. A click is a request for one.
 */
export function isAwaitingAnswer(application: JobApplicationInput): boolean {
  return (
    application.createdBy === 'RESIDENT' &&
    application.stage === 'INTERESTED' &&
    application.supportedByUserId === null
  )
}

/** True while at least one of this client's threads is waiting for a reply. */
export function awaitsAnswer(client: JobClientInput): boolean {
  return client.applications.some(isAwaitingAnswer)
}

function hasLiveApplication(client: JobClientInput): boolean {
  return client.applications.some((a) => LIVE_STAGES.includes(a.stage) && !isAwaitingAnswer(a))
}

function hasWorkRecord(client: JobClientInput): boolean {
  return client.learningRecords.some((r) => WORK_KINDS.includes(r.kind) && r.status !== 'EXPIRED')
}

/** Any labour-market contact at all: a live application or a work record. */
export function hasLabourMarketContact(client: JobClientInput): boolean {
  return hasLiveApplication(client) || hasWorkRecord(client)
}

function daysBetween(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)
}

/**
 * The signals raised for ONE client.
 *
 * At most one contact-related signal: a client with no contact at all already
 * gets NO_LABOUR_MARKET_CONTACT, and also telling the coach "and they are on a
 * course" would be two rows for one conversation.
 *
 * An unanswered interest takes that slot outright, and does so whether or not
 * the person has other contact — someone is waiting for a reply either way.
 * "Find this person something" is the wrong next move when they have already
 * found it themselves and are waiting to hear back.
 */
export function signalsFor(client: JobClientInput, now: Date): JobSignalId[] {
  const signals: JobSignalId[] = []
  const contact = hasLabourMarketContact(client)

  if (awaitsAnswer(client)) {
    signals.push('INTEREST_UNANSWERED')
  } else if (!contact && daysBetween(client.createdAt, now) >= NO_CONTACT_GRACE_DAYS) {
    signals.push('NO_LABOUR_MARKET_CONTACT')
  } else if (!contact) {
    // Still inside the grace period. A running course with nothing alongside
    // it is worth naming early, because the lock-in effect starts immediately
    // rather than at the point somebody notices.
    const onCourse = client.learningRecords.some(
      (r) => r.status === 'IN_PROGRESS' && !WORK_KINDS.includes(r.kind),
    )
    if (onCourse) signals.push('COURSE_WITHOUT_WORK')
  }

  const stalled = client.learningRecords.some(
    (r) => r.status === 'IN_PROGRESS' && daysBetween(r.updatedAt, now) >= STALLED_RECORD_DAYS,
  )
  if (stalled) signals.push('STALLED_RECORD')

  return signals
}

/**
 * The whole queue, one row per (client, signal).
 *
 * Rows rather than clients because a coach works a signal, not a person: "who
 * has no contact yet" and "whose record has stopped" are different sittings.
 * The dashboard counts rows, which is why a client with two signals correctly
 * represents two pieces of work.
 */
export function buildJobQueue(clients: JobClientInput[], now: Date): JobQueueItem[] {
  const rows = clients.flatMap((client) =>
    signalsFor(client, now).map((signal) => ({
      residentId: client.residentId,
      name: client.name,
      signal,
    })),
  )

  // Ordered by signal, not by whichever client the query happened to return
  // first. The dashboard hero shows `jobQueue[0]` and nothing else, so without
  // this a person waiting for a reply loses the one prominent slot on the
  // screen to a record that has been sitting still for six weeks — decided by
  // row order, which is not a priority.
  //
  // JOB_SIGNAL_IDS is therefore the priority list, and it is already the order
  // the tiles render in. One list, both uses.
  return rows.sort((a, b) => JOB_SIGNAL_IDS.indexOf(a.signal) - JOB_SIGNAL_IDS.indexOf(b.signal))
}
