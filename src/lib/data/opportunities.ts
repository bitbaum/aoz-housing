/**
 * Opportunity queries. I/O only — the pipeline rules live in
 * `lib/opportunities/pipeline.ts` so they can be tested without a database.
 */

import { prisma } from '@/lib/db'
import { RESIDENT_NAME_SELECT } from '@/lib/utils/resident-name'
import type {
  ApplicationStageId,
  OpportunityKindId,
  OpportunityStatusId,
} from '@/lib/config/opportunities'
import { isActiveStage, occupiesSeat, openSeats } from '@/lib/opportunities/pipeline'

/** Rows that reach the UI carry `displayName`, never a bare code. */
const APPLICATION_INCLUDE = {
  resident: { select: RESIDENT_NAME_SELECT },
  supportedBy: { select: { id: true, name: true } },
  learningRecord: { select: { id: true } },
} as const

export interface OpportunityListFilters {
  status?: OpportunityStatusId
  kind?: OpportunityKindId
  query?: string
  publishedOnly?: boolean
}

function listWhere(filters: OpportunityListFilters) {
  const query = filters.query?.trim() ?? ''
  return {
    ...(filters.publishedOnly
      ? { status: 'PUBLISHED' as const }
      : filters.status
        ? { status: filters.status }
        : {}),
    ...(filters.kind ? { kind: filters.kind } : {}),
    ...(query
      ? {
          OR: [
            { title: { contains: query, mode: 'insensitive' as const } },
            { organisation: { contains: query, mode: 'insensitive' as const } },
            { location: { contains: query, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  }
}

/**
 * Listings with the stages of everyone attached, so a caller can compute open
 * seats without a second query per row.
 */
export async function listOpportunities(filters: OpportunityListFilters = {}) {
  return prisma.opportunity.findMany({
    where: listWhere(filters),
    include: {
      applications: { select: { id: true, stage: true } },
    },
    orderBy: [{ status: 'asc' }, { startsAt: 'asc' }, { updatedAt: 'desc' }],
  })
}

export async function getOpportunityDetail(id: string) {
  return prisma.opportunity.findUnique({
    where: { id },
    include: {
      applications: {
        include: APPLICATION_INCLUDE,
        orderBy: [{ stageChangedAt: 'desc' }],
      },
    },
  })
}

/**
 * The five numbers the board leads with.
 *
 * `activePeople` and `openThreads` count APPLICATIONS, not listings, because
 * "how many places exist" is not the question a coach opens this page with —
 * "who is mid-flight and who is waiting on me" is.
 */
export async function opportunityStats() {
  const [total, published, drafts, activePeople, openThreads] = await Promise.all([
    prisma.opportunity.count(),
    prisma.opportunity.count({ where: { status: 'PUBLISHED' } }),
    prisma.opportunity.count({ where: { status: 'DRAFT' } }),
    prisma.opportunityApplication.count({ where: { stage: 'STARTED' } }),
    prisma.opportunityApplication.count({
      where: { stage: { in: ['INTERESTED', 'APPLIED', 'INTERVIEW', 'ACCEPTED'] } },
    }),
  ])

  return { total, published, drafts, activePeople, openThreads }
}

/**
 * Residents who could still be added to this listing.
 *
 * Excludes anyone already attached — the pair is unique in the database, so
 * offering them again would produce a constraint error at the one moment a
 * coach is trying to record something real.
 */
export async function residentsAvailableFor(opportunityId: string) {
  const attached = await prisma.opportunityApplication.findMany({
    where: { opportunityId },
    select: { residentId: true },
  })

  return prisma.resident.findMany({
    where: {
      status: 'ACTIVE',
      id: { notIn: attached.map((row) => row.residentId) },
    },
    select: RESIDENT_NAME_SELECT,
    orderBy: [{ displayName: 'asc' }, { code: 'asc' }],
  })
}

export async function getApplication(id: string) {
  return prisma.opportunityApplication.findUnique({
    where: { id },
    include: { ...APPLICATION_INCLUDE, opportunity: true },
  })
}

/** Everything a resident is currently attached to — used by their dossier. */
export async function listApplicationsForResident(residentId: string) {
  return prisma.opportunityApplication.findMany({
    where: { residentId },
    include: { opportunity: true },
    orderBy: [{ stageChangedAt: 'desc' }],
  })
}

/**
 * What ONE resident may see: the places on offer, and their own threads.
 *
 * The seat count is folded in here and the `applications` rows are dropped
 * before returning, deliberately. A resident needs to know whether a place is
 * still free; they have no business knowing WHO is in it. Returning the rows
 * and "just not rendering them" is the same mistake as selecting a password
 * hash and not printing it — the payload is the leak, not the JSX.
 */
export async function residentOpportunityBoard(residentId: string) {
  const [mine, published] = await Promise.all([
    prisma.opportunityApplication.findMany({
      where: { residentId },
      include: { opportunity: true },
      orderBy: [{ stageChangedAt: 'desc' }],
    }),
    prisma.opportunity.findMany({
      where: { status: 'PUBLISHED' },
      include: { applications: { select: { stage: true } } },
      orderBy: [{ startsAt: 'asc' }, { updatedAt: 'desc' }],
    }),
  ])

  const attached = new Set(mine.map((application) => application.opportunityId))

  const open = published
    .filter((opportunity) => !attached.has(opportunity.id))
    .map(({ applications, ...opportunity }) => ({
      ...opportunity,
      seatsLeft: openSeats(
        opportunity,
        applications.map((a) => a.stage as ApplicationStageId),
      ),
    }))
    // Places someone can still take come first; a full one stays visible rather
    // than vanishing, so "it was here yesterday" has an answer on the page.
    .sort((a, b) => Number(a.seatsLeft === 0) - Number(b.seatsLeft === 0))

  return { mine, open }
}

export type ResidentOpportunityBoard = Awaited<ReturnType<typeof residentOpportunityBoard>>
export type ResidentApplicationRow = ResidentOpportunityBoard['mine'][number]
export type ResidentOpenRow = ResidentOpportunityBoard['open'][number]

export type OpportunityListRow = Awaited<ReturnType<typeof listOpportunities>>[number]
export type OpportunityDetail = NonNullable<Awaited<ReturnType<typeof getOpportunityDetail>>>
export type ApplicationRow = OpportunityDetail['applications'][number]

/** Stage helpers re-exported so pages import one module, not two. */
export function seatStages(
  applications: readonly { stage: ApplicationStageId }[],
): ApplicationStageId[] {
  return applications.map((a) => a.stage)
}

export function countActive(applications: readonly { stage: ApplicationStageId }[]): number {
  return applications.filter((a) => isActiveStage(a.stage)).length
}

export function countHoldingSeat(applications: readonly { stage: ApplicationStageId }[]): number {
  return applications.filter((a) => occupiesSeat(a.stage)).length
}
