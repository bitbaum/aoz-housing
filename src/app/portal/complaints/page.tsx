import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getPortalResident } from '@/lib/portal-auth'
import { getRequestTranslator } from '@/lib/i18n/request'
import { ComplaintForm } from './ComplaintForm'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestTranslator()
  return { title: t('nav.complaints') }
}

export const dynamic = 'force-dynamic'

/**
 * Where a resident objects to the organisation.
 *
 * A separate page from `/portal/report` on purpose. That form asks "is this a
 * broken thing or a roommate problem", and folding a third option into it
 * would put an objection to the Betreuung on the same footing as a dripping
 * tap — and route it, one branch later, into the ladder that escalates against
 * the person reporting.
 *
 * Every string here comes from the i18n dictionary, not from
 * `lib/constants/labels`. The first version of this page used the staff German
 * constants and three portal gates caught it, rightly: a complaints channel
 * that only speaks German is close to useless for the people it exists to
 * protect, who are the least likely in the building to read it.
 */
export default async function ComplaintsPage() {
  const resident = await getPortalResident()
  if (!resident) redirect('/login')

  const { t } = await getRequestTranslator()

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-ui-text">{t('complaints.title')}</h1>
        <p className="text-ui-muted mt-2">{t('complaints.intro')}</p>
      </div>

      {/* Said before the form, not after it: whether the people it may be about
          can read it is the fact that decides whether someone dares file. */}
      <p className="alert-info">{t('complaints.whoReads')}</p>

      <ComplaintForm
        labels={{
          subjectLabel: t('complaints.subjectLabel'),
          subjects: {
            STAFF: t('complaints.subject.STAFF'),
            ACCOMMODATION: t('complaints.subject.ACCOMMODATION'),
            DECISION: t('complaints.subject.DECISION'),
            OTHER: t('complaints.subject.OTHER'),
          },
          bodyLabel: t('complaints.bodyLabel'),
          bodyPlaceholder: t('complaints.bodyPlaceholder'),
          anonymousLabel: t('complaints.anonymousLabel'),
          anonymousHint: t('complaints.anonymousHint'),
          submit: t('complaints.submit'),
          tooShort: t('complaints.tooShort'),
          sent: t('complaints.sent'),
          sentAnonymous: t('complaints.sentAnonymous'),
        }}
      />
    </div>
  )
}
