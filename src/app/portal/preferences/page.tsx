import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Präferenzen' }
import { RESIDENT_FACTORS } from '@/lib/config/resident-factors'
import { PORTAL_LABELS } from '@/lib/constants/labels'
import { PreferencesForm } from './PreferencesForm'

const LANGUAGE_OPTIONS = (RESIDENT_FACTORS.languages as { options: readonly string[] }).options.filter(c => c !== 'OTHER')
const DIET_OPTIONS = (RESIDENT_FACTORS.dietaryNeeds as { options: readonly string[] }).options.filter(c => c !== 'NONE')

export const dynamic = 'force-dynamic'

export default async function PreferencesPage() {
  const cookieStore = await cookies()
  const residentCode = cookieStore.get('resident_code')?.value

  if (!residentCode) {
    redirect('/portal')
  }

  const resident = await prisma.resident.findUnique({
    where: { code: residentCode },
  })

  if (!resident) {
    redirect('/portal?error=account_not_found')
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/portal" className="inline-flex items-center min-h-[44px] px-1 -ml-1 text-sm text-aoz-primary hover:underline">
          {PORTAL_LABELS.form.back}
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mt-2">{PORTAL_LABELS.pages.preferences}</h1>
        <p className="text-gray-500">
          {PORTAL_LABELS.pages.preferencesSubtitle}
        </p>
      </div>

      <PreferencesForm
        resident={{
          sleepSchedule: resident.sleepSchedule,
          noiseTolerance: resident.noiseTolerance,
          cleanlinessLevel: resident.cleanlinessLevel,
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
