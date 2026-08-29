import type { Metadata } from 'next'
import { getRequestTranslator } from '@/lib/i18n/request'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestTranslator()
  return { title: t('nav.preferences') }
}
import { RESIDENT_FACTORS } from '@/lib/config/resident-factors'
import { PreferencesForm } from './PreferencesForm'
import { requireResidentCookie } from '@/lib/portal-auth'
import { PageHeader } from '@/components/ui/Page'

const LANGUAGE_OPTIONS = (
  RESIDENT_FACTORS.languages as { options: readonly string[] }
).options.filter((c) => c !== 'OTHER')
const DIET_OPTIONS = (
  RESIDENT_FACTORS.dietaryNeeds as { options: readonly string[] }
).options.filter((c) => c !== 'NONE')

export const dynamic = 'force-dynamic'

export default async function PreferencesPage() {
  const residentCode = await requireResidentCookie('/portal')
  const { t } = await getRequestTranslator()

  const resident = await prisma.resident.findUnique({
    where: { code: residentCode },
  })

  if (!resident) {
    redirect('/portal?error=account_not_found')
  }

  return (
    <div>
      <div className="mb-6">
        <PageHeader
          title={t('nav.preferences')}
          description={t('preferences.subtitle')}
          backHref="/portal"
          backLabel={t('action.back')}
        />
      </div>

      <PreferencesForm
        resident={{
          sleepSchedule: resident.sleepSchedule,
          noiseTolerance: resident.noiseTolerance,
          cleanlinessPractice: resident.cleanlinessPractice,
          cleanlinessExpectation: resident.cleanlinessExpectation,
          chaosTolerance: resident.chaosTolerance,
          socialStyle: resident.socialStyle,
          privacyNeed: resident.privacyNeed,
          smokingStatus: resident.smokingStatus,
          petTolerance: resident.petTolerance,
          sharedBathroom: resident.sharedBathroom,
          sharedKitchen: resident.sharedKitchen,
          languages: resident.languages,
          dietaryNeeds: resident.dietaryNeeds,
          roommatePreferences: resident.roommatePreferences,
        }}
        languageOptions={[...LANGUAGE_OPTIONS]}
        dietOptions={[...DIET_OPTIONS]}
      />
    </div>
  )
}
