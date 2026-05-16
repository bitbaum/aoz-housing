import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { createMaintenanceRequest } from '@/lib/actions'

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

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ unit?: string; spot?: string }>
}

export default async function NewMaintenanceRequestPage({ searchParams }: Props) {
  const params = await searchParams
  const preselectedUnitId = params.unit
  const preselectedSpotId = params.spot

  const [housingUnits, residents] = await Promise.all([
    prisma.housingUnit.findMany({
      where: { status: { not: 'CLOSED' } },
      include: {
        spots: {
          where: { type: { not: 'ROOM' } },
          orderBy: { code: 'asc' },
        },
      },
      orderBy: { code: 'asc' },
    }),
    prisma.resident.findMany({
      where: { status: { in: ['ACTIVE', 'PLACED'] } },
      select: { id: true, code: true },
      orderBy: { code: 'asc' },
    }),
  ])

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href="/maintenance"
          className="inline-flex items-center min-h-[44px] px-1 -ml-1 text-sm text-aoz-primary hover:underline"
        >
          {MAINTENANCE_PAGE_LABELS.backToList}
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mt-2">
          {MAINTENANCE_PAGE_LABELS.newTitle}
        </h1>
      </div>

      <div className="card">
        <form id="maintenance-new-form" action={createMaintenanceRequest} className="space-y-6">
          <div id="maintenance-new-validation-summary" className="hidden p-3 rounded border border-status-error/40 bg-status-error/8 text-status-error-text text-sm" role="alert" />
          <FormValidationUX formId="maintenance-new-form" summaryId="maintenance-new-validation-summary" />

          {/* Location Section */}
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-900">{MAINTENANCE_PAGE_LABELS.sectionLocation}</h2>
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
                <select
                  name="spotId"
                  className="input"
                  defaultValue={preselectedSpotId || ''}
                >
                  <option value="">{MAINTENANCE_PAGE_LABELS.fieldSpotDefault}</option>
                  {housingUnits.flatMap((unit) =>
                    unit.spots.map((spot) => (
                      <option key={spot.id} value={spot.id}>
                        {unit.code} → {spot.label || spot.code}
                      </option>
                    ))
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
            <h2 className="font-semibold text-gray-900">{MAINTENANCE_PAGE_LABELS.sectionRequest}</h2>
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
            <h2 className="font-semibold text-gray-900">{MAINTENANCE_PAGE_LABELS.sectionReporter}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">{MAINTENANCE_PAGE_LABELS.fieldResident}</label>
                <select name="reportedById" className="input">
                  <option value="">{MAINTENANCE_PAGE_LABELS.fieldResidentDefault}</option>
                  {residents.map((resident) => (
                    <option key={resident.id} value={resident.id}>
                      {resident.code}
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
          <div className="sticky bottom-0 -mx-4 px-4 py-3 sm:static sm:mx-0 sm:px-0 sm:py-0 bg-white/95 backdrop-blur border-t border-gray-200 sm:border-0 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 z-20">
            <Link href="/maintenance" className="btn-outline w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center">
              {UI_LABELS.cancel}
            </Link>
            <SubmitButton className="btn-primary w-full sm:w-auto min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aoz-primary focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-wait">
              {MAINTENANCE_PAGE_LABELS.submit}
            </SubmitButton>
          </div>
        </form>
      </div>
    </div>
  )
}
