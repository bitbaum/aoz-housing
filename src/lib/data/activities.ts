import { sql, type SQL } from 'drizzle-orm'
import { randomBytes } from 'crypto'
import { db } from '@/lib/db'
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
  const { rows } = await db.execute(sql`
    SELECT *
    FROM "Activity"
    WHERE "id" = ${id}
    LIMIT 1
  `)
  const records = rows as unknown as ActivityRecord[]
  return records[0] ? mapActivity(records[0]) : null
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
  const where: SQL[] = []

  if (options.publishedOnly) {
    where.push(sql`"status" = 'PUBLISHED'::"ActivityStatus"`)
  } else if (options.status) {
    where.push(sql`"status" = ${options.status}::"ActivityStatus"`)
  }

  if (options.category) {
    where.push(sql`"category" = ${options.category}::"ActivityCategory"`)
  }

  if (options.highlightedOnly) {
    where.push(sql`"highlight" = true`)
  }

  if (options.activeOn) {
    where.push(sql`("endsAt" IS NULL OR "endsAt" >= ${options.activeOn})`)
  }

  const whereClause = where.length > 0 ? sql`WHERE ${sql.join(where, sql` AND `)}` : sql``
  const limitClause = typeof options.take === 'number' ? sql`LIMIT ${options.take}` : sql``

  const { rows } = await db.execute(sql`
    SELECT *
    FROM "Activity"
    ${whereClause}
    ORDER BY "status" ASC, "highlight" DESC, "startsAt" ASC NULLS LAST, "updatedAt" DESC
    ${limitClause}
  `)
  return rows as unknown as ActivityRecord[]
}

export async function countActivities(
  options: {
    status?: ActivityStatus
    highlightedPublished?: boolean
  } = {},
): Promise<number> {
  const where: SQL[] = []
  if (options.status) {
    where.push(sql`"status" = ${options.status}::"ActivityStatus"`)
  }
  if (options.highlightedPublished) {
    where.push(sql`"status" = 'PUBLISHED'::"ActivityStatus" AND "highlight" = true`)
  }
  const whereClause = where.length > 0 ? sql`WHERE ${sql.join(where, sql` AND `)}` : sql``
  const { rows } = await db.execute(sql`
    SELECT COUNT(*)::bigint AS count
    FROM "Activity"
    ${whereClause}
  `)
  // COUNT arrives as a string through node-postgres — coerce before returning.
  const records = rows as unknown as Array<{ count: string }>
  return Number(records[0]?.count ?? 0)
}

export async function createActivityRecord(data: ActivityWriteData): Promise<ActivityRecord> {
  const { rows } = await db.execute(sql`
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
  `)
  const records = rows as unknown as ActivityRecord[]
  return records[0]
}

export async function updateActivityRecord(
  id: string,
  data: ActivityWriteData,
): Promise<ActivityRecord> {
  const { rows } = await db.execute(sql`
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
  `)
  const records = rows as unknown as ActivityRecord[]
  return records[0]
}

export async function setActivityStatus(
  id: string,
  status: ActivityStatus,
  userId: string,
): Promise<void> {
  await db.execute(sql`
    UPDATE "Activity"
    SET
      "status" = ${status}::"ActivityStatus",
      "highlight" = CASE WHEN ${status}::"ActivityStatus" = 'ARCHIVED'::"ActivityStatus" THEN false ELSE "highlight" END,
      "updatedByUserId" = ${userId},
      "updatedAt" = now()
    WHERE "id" = ${id}
  `)
}
