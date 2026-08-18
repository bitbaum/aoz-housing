import type { Metadata } from 'next'
import { requireResidentCookie } from '@/lib/portal-auth'
import { getPortalAuth } from '@/lib/portal-auth'
import { getRequestTranslator } from '@/lib/i18n/request'
import { EmptyState, PageHeader, PageShell } from '@/components/ui/Page'
import { formatZurichDateTime } from '@/lib/utils/local-time'
import {
  listUnitEvents,
  createEventAsResident,
  rsvpToEvent,
  cancelEvent,
} from '@/lib/actions/events'

export const metadata: Metadata = { title: 'Veranstaltungen' }
export const dynamic = 'force-dynamic'

async function submitCreateEvent(formData: FormData): Promise<void> {
  'use server'
  await createEventAsResident(formData)
}

async function submitRsvp(formData: FormData): Promise<void> {
  'use server'
  await rsvpToEvent(formData)
}

async function submitCancelEvent(formData: FormData): Promise<void> {
  'use server'
  await cancelEvent(formData)
}

export default async function PortalEventsPage() {
  await requireResidentCookie('/login')
  const { t } = await getRequestTranslator()
  const [auth, events] = await Promise.all([getPortalAuth(), listUnitEvents()])

  const categoryLabels: Record<string, string> = {
    HOUSE_MEETING: t('events.categoryHouseMeeting'),
    SOCIAL: t('events.categorySocial'),
    CULTURE: t('events.categoryCulture'),
    SUPPORT: t('events.categorySupport'),
  }

  return (
    <PageShell>
      <PageHeader title={t('events.title')} description={t('events.subtitle')} />

      <div className="card">
        <h2 className="text-lg font-semibold text-ui-text mb-4">{t('events.createNew')}</h2>
        <form action={submitCreateEvent} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label htmlFor="ev-title" className="label">{t('events.formTitle')}</label>
            <input id="ev-title" name="title" required className="input" />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="ev-description" className="label">{t('events.formDescription')}</label>
            <textarea id="ev-description" name="description" required rows={2} className="input" />
          </div>
          <div>
            <label htmlFor="ev-category" className="label">{t('events.formCategory')}</label>
            <select id="ev-category" name="category" className="input" defaultValue="SOCIAL">
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="ev-location" className="label">{t('events.formLocation')}</label>
            <input id="ev-location" name="location" className="input" />
          </div>
          <div>
            <label htmlFor="ev-startsAt" className="label">{t('events.formStartsAt')}</label>
            <input id="ev-startsAt" name="startsAt" type="datetime-local" required className="input" />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="btn-primary min-h-[44px] px-6">
              {t('events.submit')}
            </button>
          </div>
        </form>
      </div>

      {!events || events.length === 0 ? (
        <EmptyState title={t('events.empty')} />
      ) : (
        <div className="space-y-3">
          {events.map((event) => {
            const myRsvp = auth
              ? event.rsvps.find((rsvp) => rsvp.residentId === auth.resident.id)
              : undefined
            const isCreator = Boolean(auth && event.createdByResidentId === auth.resident.id)
            return (
              <div key={event.id} className="card">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-ui-text">{event.title}</span>
                  <span className="chip chip-neutral">{categoryLabels[event.category]}</span>
                  {event.status === 'CANCELLED' ? (
                    <span className="badge badge-ended">{t('events.cancelled')}</span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-ui-muted">{event.description}</p>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-ui-muted">
                  <span>{formatZurichDateTime(event.startsAt)}</span>
                  {event.location ? <span>{event.location}</span> : null}
                  <span>{event.rsvps.filter((r) => r.status === 'GOING').length} × {t('events.rsvpGoing')}</span>
                </div>
                {event.status !== 'CANCELLED' ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(['GOING', 'MAYBE', 'DECLINED'] as const).map((status) => (
                      <form key={status} action={submitRsvp}>
                        <input type="hidden" name="eventId" value={event.id} />
                        <input type="hidden" name="status" value={status} />
                        <button
                          type="submit"
                          className={myRsvp?.status === status ? 'btn-secondary min-h-[44px] px-4' : 'btn-outline min-h-[44px] px-4'}
                        >
                          {status === 'GOING' ? t('events.rsvpGoing') : status === 'MAYBE' ? t('events.rsvpMaybe') : t('events.rsvpDeclined')}
                        </button>
                      </form>
                    ))}
                    {isCreator ? (
                      <form action={submitCancelEvent}>
                        <input type="hidden" name="id" value={event.id} />
                        <button type="submit" className="btn-ghost min-h-[44px] px-4">
                          {t('events.cancel')}
                        </button>
                      </form>
                    ) : null}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      )}
    </PageShell>
  )
}
