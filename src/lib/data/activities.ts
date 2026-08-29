import { Prisma } from '@prisma/client'
import { randomBytes } from 'crypto'
import { prisma } from '@/lib/db'
import type { ActivityCategory, ActivityRecord, ActivityStatus } from '@/lib/config/activities'

type ActivityWriteData = {
  title: string
  description: string
  category: ActivityCategory
  cost: ActivityRecord['cost']
  costNote: string | null
  location: string | null
  website: string | null
  phone: string | null
  schedule: string | null
  startsAt: Date | null
  endsAt: Date | null
  status: ActivityStatus
  highlight: boolean
  userId: string
}

function mapActivity(row: ActivityRecord): ActivityRecord {
  return row
}

function createCuidLikeId() {
  return `c${randomBytes(12).toString('hex')}`
}

export async function getActivityById(id: string): Promise<ActivityRecord | null> {
  const rows = await prisma.$queryRaw<ActivityRecord[]>`
    SELECT *
    FROM "Activity"
    WHERE "id" = ${id}
    LIMIT 1
  `
  return rows[0] ? mapActivity(rows[0]) : null
}

export async function listActivities(
  options: {
    status?: ActivityStatus
    category?: ActivityCategory
    publishedOnly?: boolean
    highlightedOnly?: boolean
    activeOn?: Date
    take?: number
  } = {},
): Promise<ActivityRecord[]> {
  const where: Prisma.Sql[] = []

  if (options.publishedOnly) {
    where.push(Prisma.sql`"status" = 'PUBLISHED'::"ActivityStatus"`)
  } else if (options.status) {
    where.push(Prisma.sql`"status" = ${options.status}::"ActivityStatus"`)
  }

  if (options.category) {
    where.push(Prisma.sql`"category" = ${options.category}::"ActivityCategory"`)
  }

  if (options.highlightedOnly) {
    where.push(Prisma.sql`"highlight" = true`)
  }

  if (options.activeOn) {
    where.push(Prisma.sql`("endsAt" IS NULL OR "endsAt" >= ${options.activeOn})`)
  }

  const whereClause =
    where.length > 0 ? Prisma.sql`WHERE ${Prisma.join(where, ' AND ')}` : Prisma.empty
  const limitClause =
    typeof options.take === 'number' ? Prisma.sql`LIMIT ${options.take}` : Prisma.empty

  return prisma.$queryRaw<ActivityRecord[]>`
    SELECT *
    FROM "Activity"
    ${whereClause}
    ORDER BY "status" ASC, "highlight" DESC, "startsAt" ASC NULLS LAST, "updatedAt" DESC
    ${limitClause}
  `
}

export async function countActivities(
  options: {
    status?: ActivityStatus
    highlightedPublished?: boolean
  } = {},
): Promise<number> {
  const where: Prisma.Sql[] = []
  if (options.status) {
    where.push(Prisma.sql`"status" = ${options.status}::"ActivityStatus"`)
  }
  if (options.highlightedPublished) {
    where.push(Prisma.sql`"status" = 'PUBLISHED'::"ActivityStatus" AND "highlight" = true`)
  }
  const whereClause =
    where.length > 0 ? Prisma.sql`WHERE ${Prisma.join(where, ' AND ')}` : Prisma.empty
  const rows = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS count
    FROM "Activity"
    ${whereClause}
  `
  return Number(rows[0]?.count ?? 0)
}

export async function createActivityRecord(data: ActivityWriteData): Promise<ActivityRecord> {
  const rows = await prisma.$queryRaw<ActivityRecord[]>`
    INSERT INTO "Activity" (
      "id", "updatedAt", "title", "description", "category", "cost", "costNote",
      "location", "website", "phone", "schedule", "startsAt", "endsAt",
      "status", "highlight", "createdByUserId", "updatedByUserId"
    )
    VALUES (
      ${createCuidLikeId()}, now(), ${data.title}, ${data.description},
      ${data.category}::"ActivityCategory", ${data.cost}::"ActivityCost", ${data.costNote},
      ${data.location}, ${data.website}, ${data.phone}, ${data.schedule}, ${data.startsAt}, ${data.endsAt},
      ${data.status}::"ActivityStatus", ${data.highlight}, ${data.userId}, ${data.userId}
    )
    RETURNING *
  `
  return rows[0]
}

export async function updateActivityRecord(
  id: string,
  data: ActivityWriteData,
): Promise<ActivityRecord> {
  const rows = await prisma.$queryRaw<ActivityRecord[]>`
    UPDATE "Activity"
    SET
      "updatedAt" = now(),
      "title" = ${data.title},
      "description" = ${data.description},
      "category" = ${data.category}::"ActivityCategory",
      "cost" = ${data.cost}::"ActivityCost",
      "costNote" = ${data.costNote},
      "location" = ${data.location},
      "website" = ${data.website},
      "phone" = ${data.phone},
      "schedule" = ${data.schedule},
      "startsAt" = ${data.startsAt},
      "endsAt" = ${data.endsAt},
      "status" = ${data.status}::"ActivityStatus",
      "highlight" = ${data.highlight},
      "updatedByUserId" = ${data.userId}
    WHERE "id" = ${id}
    RETURNING *
  `
  return rows[0]
}

export async function setActivityStatus(
  id: string,
  status: ActivityStatus,
  userId: string,
): Promise<void> {
  await prisma.$executeRaw`
    UPDATE "Activity"
    SET
      "status" = ${status}::"ActivityStatus",
      "highlight" = CASE WHEN ${status}::"ActivityStatus" = 'ARCHIVED'::"ActivityStatus" THEN false ELSE "highlight" END,
      "updatedByUserId" = ${userId},
      "updatedAt" = now()
    WHERE "id" = ${id}
  `
}
