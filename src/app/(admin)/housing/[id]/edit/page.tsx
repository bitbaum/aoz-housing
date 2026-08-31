import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { HousingFormFields, FormValidationUX } from '@/components/forms'
import { SubmitButton } from '@/components/ui'
import { PageHeader } from '@/components/ui/Page'
import { updateHousingUnit } from '@/lib/actions'
import { HousingDangerZone } from '@/components/housing/HousingDangerZone'
import { HOUSING_EDIT_LABELS } from '@/lib/constants'
import { HOUSING_STATUS_LABELS } from '@/lib/constants/labels/housing'
import { requirePermission } from '@/lib/auth'

export const metadata: Metadata = { title: 'Unterkunft bearbeiten' }

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditHousingPage({ params }: Props) {
  await requirePermission('housing:write')
  const { id } = await params

  const unit = await prisma.housingUnit.findUnique({
    where: { id },
  })

  if (!unit) {
    notFound()
  }

  return (
    <div>
      <div className="mb-6">
        <PageHeader
          title={HOUSING_EDIT_LABELS.title(unit.code)}
          description={HOUSING_EDIT_LABELS.subtitle}
          backHref={`/housing/${id}`}
          backLabel={HOUSING_EDIT_LABELS.backLink.replace(/^← /, '')}
        />
      </div>

      <form id="housing-edit-form" action={updateHousingUnit} className="space-y-6">
        <input type="hidden" name="id" value={id} />

        <div id="housing-edit-validation-summary" className="hidden alert-error" role="alert" />
        <FormValidationUX formId="housing-edit-form" summaryId="housing-edit-validation-summary" />

        {/* Status — edit-only field: controls matching eligibility */}
        <div className="card">
          <h2 className="text-lg font-semibold text-ui-text mb-1">
            {HOUSING_EDIT_LABELS.statusLabel}
          </h2>
          <p className="text-sm text-ui-muted mb-4">{HOUSING_EDIT_LABELS.statusDescription}</p>
          <select name="status" defaultValue={unit.status} className="input max-w-xs">
            {Object.entries(HOUSING_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <HousingFormFields
          defaultValues={{
            code: unit.code,
            address: unit.address,
            totalBeds: unit.totalBeds,
            totalRooms: unit.totalRooms,
            sharedRooms: unit.sharedRooms,
            privateRooms: unit.privateRooms,
            sharedBathrooms: unit.sharedBathrooms,
            privateBathrooms: unit.privateBathrooms,
            sharedKitchen: unit.sharedKitchen,
            privateKitchen: unit.privateKitchen,
            groundFloor: unit.groundFloor,
            wheelchairAccess: unit.wheelchairAccess,
            elevator: unit.elevator,
            smokingAllowed: unit.smokingAllowed,
            petsAllowed: unit.petsAllowed,
            quietHours: unit.quietHours,
            nearPublicTransport: unit.nearPublicTransport,
            nearHealthServices: unit.nearHealthServices,
            nearSchools: unit.nearSchools,
            notes: unit.notes,
          }}
          isEdit
        />

        {/* Actions */}
        <div className="sticky bottom-0 -mx-4 px-4 py-3 pb-safe sm:static sm:mx-0 sm:px-0 sm:py-0 bg-ui-surface/95 backdrop-blur border-t border-ui-border sm:border-0 flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 z-20">
          <SubmitButton className="btn-primary w-full sm:w-auto min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-wait">
            {HOUSING_EDIT_LABELS.submit}
          </SubmitButton>
          <Link
            href={`/housing/${id}`}
            className="btn-outline w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center"
          >
            {HOUSING_EDIT_LABELS.cancel}
          </Link>
        </div>
      </form>

      <HousingDangerZone housingUnitId={id} code={unit.code} />
    </div>
  )
}
