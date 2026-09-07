import type { Metadata } from 'next'

import { db, clientHealthContact, clientInsurance, clientPermit, resident } from '@/lib/db'
import { desc, eq } from 'drizzle-orm'

import { ClientFactsBoard } from '@/components/portal/ClientFactsBoard'
import { getRequestTranslator } from '@/lib/i18n/request'
import { requireResidentCookie } from '@/lib/portal-auth'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestTranslator()
  return { title: t('documents.title') }
}

/**
 * Meine Unterlagen — the facts a client used to have to ask for.
 *
 * Deliberately reached through the resident CODE rather than `getPortalAuth`,
 * which requires an ACTIVE PLACEMENT. Insurance and a permit belong to the
 * person, not to the flat: someone between placements still has both, and is
 * arguably the person who most needs them in one place. Every other portal
 * page is unit-scoped because it is about living together; this one is not.
 */
export default async function PortalDocumentsPage() {
  const residentCode = await requireResidentCookie('/login')
  const { t, locale } = await getRequestTranslator()

  const me = await db.query.resident.findFirst({
    where: eq(resident.code, residentCode),
    columns: { id: true },
  })
  if (!me) return null

  const [insurances, contacts, permit] = await Promise.all([
    db.query.clientInsurance.findMany({
      where: eq(clientInsurance.residentId, me.id),
      orderBy: [desc(clientInsurance.createdAt)],
    }),
    db.query.clientHealthContact.findMany({
      where: eq(clientHealthContact.residentId, me.id),
      orderBy: [desc(clientHealthContact.createdAt)],
    }),
    db.query.clientPermit.findFirst({
      where: eq(clientPermit.residentId, me.id),
    }),
  ])

  return (
    <ClientFactsBoard
      locale={locale}
      labels={{
        title: t('documents.title'),
        intro: t('documents.intro'),
        privacy: t('documents.privacy'),
        statusPending: t('documents.statusPending'),
        statusConfirmed: t('documents.statusConfirmed'),
        statusRejected: t('documents.statusRejected'),
        confirmMeaning: t('documents.confirmMeaning'),
        staffNote: t('documents.staffNote'),
        add: t('documents.add'),
        edit: t('documents.edit'),
        remove: t('documents.delete'),
        save: t('documents.save'),
        cancel: t('documents.cancel'),
        saved: t('documents.saved'),
        insurance: t('documents.insurance'),
        insuranceEmpty: t('documents.insuranceEmpty'),
        insurerName: t('documents.insurerName'),
        policyNumber: t('documents.policyNumber'),
        validUntil: t('documents.validUntil'),
        validUntilHint: t('documents.validUntilHint'),
        healthContacts: t('documents.healthContacts'),
        healthContactsEmpty: t('documents.healthContactsEmpty'),
        healthContactsHint: t('documents.healthContactsHint'),
        contactName: t('documents.contactName'),
        contactProfession: t('documents.contactProfession'),
        contactProfessionHint: t('documents.contactProfessionHint'),
        contactPhone: t('documents.contactPhone'),
        contactAddress: t('documents.contactAddress'),
        contactNote: t('documents.contactNote'),
        permit: t('documents.permit'),
        permitHint: t('documents.permitHint'),
        permitEmpty: t('documents.permitEmpty'),
        permitType: t('documents.permitType'),
        renewalDue: t('documents.renewalDue'),
        renewalExpired: t('documents.renewalExpired'),
        renewalNone: t('documents.renewalNone'),
        permitTypes: {
          N: t('documents.permitN'),
          F: t('documents.permitF'),
          B: t('documents.permitB'),
          C: t('documents.permitC'),
          S: t('documents.permitS'),
          OTHER: t('documents.permitOther'),
          UNSPECIFIED: t('documents.permitUnspecified'),
        },
      }}
      insurances={insurances.map((row) => ({
        id: row.id,
        insurerName: row.insurerName,
        policyNumber: row.policyNumber,
        validUntil: row.validUntil ? row.validUntil.toISOString() : null,
        status: row.status,
        staffNote: row.staffNote,
      }))}
      contacts={contacts.map((row) => ({
        id: row.id,
        name: row.name,
        profession: row.profession,
        phone: row.phone,
        address: row.address,
        note: row.note,
        status: row.status,
        staffNote: row.staffNote,
      }))}
      permit={
        permit
          ? {
              id: permit.id,
              type: permit.type,
              validUntil: permit.validUntil ? permit.validUntil.toISOString() : null,
              status: permit.status,
              staffNote: permit.staffNote,
            }
          : null
      }
    />
  )
}
