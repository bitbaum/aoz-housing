import type { Metadata } from 'next'
import { db, housingUnit } from '@/lib/db'
import { inArray, asc } from 'drizzle-orm'
import { PageHeader, EmptyState } from '@/components/ui/Page'
import { StaffChoreForm } from '@/components/housing/StaffChoreForm'
import { CHORE_LABELS } from '@/lib/config/household-tasks'
import { UNIT_NAME_SELECT } from '@/lib/utils/unit-name'

export const metadata: Metadata = { title: CHORE_LABELS.actions.create }

export const dynamic = 'force-dynamic'

/**
 * Staff writing down a chore for a house.
 *
 * Until now only residents could create one, because the only route that made
 * a task read its unit from the author's own placement — an assumption that
 * quietly excluded everybody who does not live in a unit. A caseworker who
 * agreed a cleaning rota during a visit had nowhere to put it, so the
 * agreement stayed in their notes and the house never saw it.
 */
export default async function NewStaffChorePage() {
  const units = await db.query.housingUnit.findMany({
    where: inArray(housingUnit.status, ['AVAILABLE', 'FULL']),
    columns: { id: true, ...UNIT_NAME_SELECT },
    orderBy: [asc(housingUnit.code)],
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title={CHORE_LABELS.actions.create}
        description={CHORE_LABELS.admin.createHint}
        backHref="/chores"
      />

      {units.length === 0 ? (
        <EmptyState title={CHORE_LABELS.admin.noUnits} />
      ) : (
        <StaffChoreForm units={units} />
      )}
    </div>
  )
}
