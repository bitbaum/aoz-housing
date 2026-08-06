import type { Metadata } from 'next'
import Link from 'next/link'
import { HousingFormFields } from '@/components/forms'
import { SubmitButton } from '@/components/ui'
import { createHousingUnit } from '@/lib/actions'
import { HOUSING_NEW_LABELS, UI_LABELS } from '@/lib/constants'

export const metadata: Metadata = { title: 'Neue Unterkunft' }

export const dynamic = 'force-dynamic'

export default function NewHousingPage() {
  return (
    <div>
      <div className="mb-6">
        <Link
          href="/housing"
          className="inline-flex items-center min-h-[44px] px-1 -ml-1 text-sm text-brand-primary hover:underline"
        >
          {HOUSING_NEW_LABELS.backLink}
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-ui-text mt-2">
          {HOUSING_NEW_LABELS.title}
        </h1>
        <p className="text-ui-muted">
          {HOUSING_NEW_LABELS.subtitle}
        </p>
      </div>

      {/* Process Indicator */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-brand-primary text-ui-on-accent flex items-center justify-center text-sm font-medium">
            1
          </div>
          <span className="text-sm font-medium text-ui-text">{HOUSING_NEW_LABELS.step1Label}</span>
        </div>
        <div className="flex-1 h-0.5 bg-ui-border" />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-ui-border text-ui-muted flex items-center justify-center text-sm font-medium">
            2
          </div>
          <span className="text-sm text-ui-muted">{HOUSING_NEW_LABELS.step2Label}</span>
        </div>
      </div>

      <form action={createHousingUnit} className="space-y-6">
        <HousingFormFields />

        {/* Actions */}
        <div className="sticky bottom-0 -mx-4 px-4 py-3 pb-safe sm:static sm:mx-0 sm:px-0 sm:py-0 bg-ui-surface/95 backdrop-blur border-t border-ui-border sm:border-0 flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 z-20">
          <SubmitButton className="btn-primary w-full sm:w-auto min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-wait">
            {HOUSING_NEW_LABELS.submit}
          </SubmitButton>
          <Link href="/housing" className="btn-outline w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center">
            {UI_LABELS.cancel}
          </Link>
        </div>
      </form>
    </div>
  )
}
