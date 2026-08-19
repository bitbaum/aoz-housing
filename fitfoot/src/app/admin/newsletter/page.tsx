import { desc, isNull } from 'drizzle-orm'
import { db } from '@/db'
import { newsletterSubscribers } from '@/db/schema'

export default async function AdminNewsletterPage() {
  const subscribers = await db
    .select()
    .from(newsletterSubscribers)
    .where(isNull(newsletterSubscribers.unsubscribedAt))
    .orderBy(desc(newsletterSubscribers.subscribedAt))

  return (
    <div>
      <h1 className="font-heading text-3xl">Newsletter</h1>
      <p className="mt-2 text-sm text-muted">
        {subscribers.length} active {subscribers.length === 1 ? 'subscriber' : 'subscribers'}. Copy
        the list into your mailing tool of choice.
      </p>

      {subscribers.length === 0 ? (
        <p className="mt-8 rounded border border-dashed border-line p-8 text-center text-muted">
          No subscribers yet.
        </p>
      ) : (
        <>
          <ul className="mt-6 space-y-1">
            {subscribers.map((sub) => (
              <li
                key={sub.id}
                className="flex items-center justify-between rounded border border-line px-4 py-2 text-sm"
              >
                <span>{sub.email}</span>
                <span className="text-muted">
                  since {sub.subscribedAt.toLocaleDateString('en-CH')}
                </span>
              </li>
            ))}
          </ul>
          <details className="mt-6">
            <summary className="cursor-pointer text-sm font-medium text-muted">
              Copy-paste list
            </summary>
            <textarea
              readOnly
              rows={6}
              className="input-field mt-2 font-mono text-xs"
              value={subscribers.map((s) => s.email).join('\n')}
            />
          </details>
        </>
      )}
    </div>
  )
}
