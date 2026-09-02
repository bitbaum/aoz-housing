import type { Metadata } from 'next'
import { db, housingUnit, placementSpot, resident } from '@/lib/db'
import { ne, inArray, asc } from 'drizzle-orm'
import Link from 'next/link'
import { createMaintenanceRequest } from '@/lib/actions'
import { requirePermission } from '@/lib/auth'

export const metadata: Metadata = { title: 'Neue Wartungsanfrage' }
import {
  MAINTENANCE_CATEGORY_LABELS,
  MAINTENANCE_CATEGORY_ICONS,
  MAINTENANCE_PRIORITY_LABELS,
  MAINTENANCE_PAGE_LABELS,
  UI_LABELS,
} from '@/lib/constants'
import { FormValidationUX } from '@/components/forms'
import { SubmitButton } from '@/components/ui'
import { PageHeader } from '@/components/ui/Page'
import { RESIDENT_NAME_SELECT, residentName } from '@/lib/utils/resident-name'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ unit?: string; spot?: string }>
}

/** Creating a repair ticket is a write. @see ../page.tsx for why this was missing. */
export default async function NewMaintenanceRequestPage({ searchParams }: Props) {
  await requirePermission('maintenance:write')
  const params = await searchParams
  const preselectedUnitId = params.unit
  const preselectedSpotId = params.spot

  const [housingUnits, residents] = await Promise.all([
    db.query.housingUnit.findMany({
      where: ne(housingUnit.status, 'CLOSED'),
      with: {
        spots: {
          where: ne(placementSpot.type, 'ROOM'),
          orderBy: [asc(placementSpot.code)],
        },
      },
      orderBy: [asc(housingUnit.code)],
    }),
    db.query.resident.findMany({
      where: inArray(resident.status, ['ACTIVE', 'PLACED']),
      columns: RESIDENT_NAME_SELECT,
      orderBy: [asc(resident.code)],
    }),
  ])

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <PageHeader
          title={MAINTENANCE_PAGE_LABELS.newTitle}
          backHref="/maintenance"
          backLabel={MAINTENANCE_PAGE_LABELS.backToList.replace(/^← /, '')}
        />
      </div>

      <div className="card">
        <form id="maintenance-new-form" action={createMaintenanceRequest} className="space-y-6">
          <div
            id="maintenance-new-validation-summary"
            className="hidden alert-error"
            role="alert"
          />
          <FormValidationUX
            formId="maintenance-new-form"
            summaryId="maintenance-new-validation-summary"
          />

          {/* Location Section */}
          <div className="space-y-4">
            <h2 className="font-semibold text-ui-text">
              {MAINTENANCE_PAGE_LABELS.sectionLocation}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">{MAINTENANCE_PAGE_LABELS.fieldUnit}</label>
                <select
                  name="housingUnitId"
                  required
                  className="input"
                  defaultValue={preselectedUnitId || ''}
                >
                  <option value="">{UI_LABELS.selectPlaceholder}</option>
                  {housingUnits.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.code} - {unit.address}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">{MAINTENANCE_PAGE_LABELS.fieldSpot}</label>
                <select name="spotId" className="input" defaultValue={preselectedSpotId || ''}>
                  <option value="">{MAINTENANCE_PAGE_LABELS.fieldSpotDefault}</option>
                  {housingUnits.flatMap((unit) =>
                    unit.spots.map((spot) => (
                      <option key={spot.id} value={spot.id}>
                        {unit.code} → {spot.label || spot.code}
                      </option>
                    )),
                  )}
                </select>
              </div>
            </div>
            <div>
              <label className="label">{MAINTENANCE_PAGE_LABELS.fieldLocationDetails}</label>
              <input
                type="text"
                name="location"
                placeholder={MAINTENANCE_PAGE_LABELS.fieldLocationPlaceholder}
                className="input"
              />
            </div>
          </div>

          {/* Request Details */}
          <div className="space-y-4">
            <h2 className="font-semibold text-ui-text">{MAINTENANCE_PAGE_LABELS.sectionRequest}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">{MAINTENANCE_PAGE_LABELS.fieldCategory}</label>
                <select name="category" required className="input">
                  <option value="">{UI_LABELS.selectPlaceholder}</option>
                  {Object.entries(MAINTENANCE_CATEGORY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {MAINTENANCE_CATEGORY_ICONS[key]} {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">{MAINTENANCE_PAGE_LABELS.fieldPriority}</label>
                <select name="priority" required className="input" defaultValue="NORMAL">
                  {Object.entries(MAINTENANCE_PRIORITY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="label">{MAINTENANCE_PAGE_LABELS.fieldTitle}</label>
              <input
                type="text"
                name="title"
                required
                placeholder={MAINTENANCE_PAGE_LABELS.fieldTitlePlaceholder}
                className="input"
              />
            </div>
            <div>
              <label className="label">{MAINTENANCE_PAGE_LABELS.fieldDescription}</label>
              <textarea
                name="description"
                required
                rows={4}
                placeholder={MAINTENANCE_PAGE_LABELS.fieldDescriptionPlaceholder}
                className="input"
              />
            </div>
          </div>

          {/* Reporter */}
          <div className="space-y-4">
            <h2 className="font-semibold text-ui-text">
              {MAINTENANCE_PAGE_LABELS.sectionReporter}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">{MAINTENANCE_PAGE_LABELS.fieldResident}</label>
                <select name="reportedById" className="input">
                  <option value="">{MAINTENANCE_PAGE_LABELS.fieldResidentDefault}</option>
                  {residents.map((resident) => (
                    <option key={resident.id} value={resident.id}>
                      {residentName(resident)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">{MAINTENANCE_PAGE_LABELS.fieldReporterName}</label>
                <input
                  type="text"
                  name="reporterName"
                  placeholder={MAINTENANCE_PAGE_LABELS.fieldReporterNamePlaceholder}
                  className="input"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="sticky bottom-0 -mx-4 px-4 py-3 pb-safe sm:static sm:mx-0 sm:px-0 sm:py-0 bg-ui-surface/95 backdrop-blur border-t border-ui-border sm:border-0 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 z-20">
            <Link
              href="/maintenance"
              className="btn-outline w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center"
            >
              {UI_LABELS.cancel}
            </Link>
            <SubmitButton className="btn-primary w-full sm:w-auto min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-wait">
              {MAINTENANCE_PAGE_LABELS.submit}
            </SubmitButton>
          </div>
        </form>
      </div>
    </div>
  )
}
