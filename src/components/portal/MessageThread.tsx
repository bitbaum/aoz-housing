'use client'

import { useEffect, useRef, useState } from 'react'
import { Send } from 'lucide-react'
import { useT } from '@/lib/i18n/LocaleProvider'
import { MESSAGE_BODY_MAX_LENGTH, isSendableBody, type MessageRow } from '@/lib/messaging/thread'
import { formatDateTime } from '@/lib/utils/formatting'

/**
 * The resident's side of the conversation.
 *
 * Optimistic: the message appears the moment it is sent, before the server
 * confirms. On a phone in a building with poor reception, a compose box that
 * empties and shows nothing for two seconds reads as "it did not send", and
 * people send again.
 */
export function MessageThreadView({ initialMessages }: { initialMessages: MessageRow[] }) {
  const t = useT()
  const [messages, setMessages] = useState(initialMessages)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  // Newest message in view on open — a conversation you have to scroll to read
  // the end of is one people stop reading.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length])

  async function send(event: React.FormEvent) {
    event.preventDefault()
    if (!isSendableBody(body) || sending) return

    const text = body.trim()
    setSending(true)
    setBody('')

    const pending: MessageRow = {
      id: `pending-${messages.length}`,
      authorResidentId: 'self',
      authorUserId: null,
      body: text,
      createdAt: new Date(),
      readAt: null,
    }
    setMessages((current) => [...current, pending])

    try {
      const response = await fetch('/api/portal/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: text }),
      })
      const result = await response.json()
      if (!result.success) throw new Error(result.error)

      setMessages((current) =>
        current.map((message) => (message.id === pending.id ? result.data.message : message))
      )
    } catch {
      // Put the text back in the box rather than leaving a message on screen
      // that never reached anybody. A message you believe you sent is worse
      // than one you can see failed.
      setMessages((current) => current.filter((message) => message.id !== pending.id))
      setBody(text)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {messages.length === 0 ? (
        <p className="text-sm text-ui-muted py-8 text-center">{t('messages.empty')}</p>
      ) : (
        <ol className="space-y-3">
          {messages.map((message) => {
            const mine = message.authorResidentId !== null
            return (
              <li key={message.id} className={mine ? 'flex justify-end' : 'flex justify-start'}>
                <div
                  className={`max-w-[85%] rounded-lg border p-3 ${
                    mine
                      ? 'bg-ui-subtle border-ui-border'
                      : 'bg-ui-surface border-ui-border-strong'
                  }`}
                >
                  <p className="eyebrow">{mine ? t('messages.you') : t('messages.staff')}</p>
                  <p className="text-sm text-ui-text mt-1 whitespace-pre-line">{message.body}</p>
                  <p className="text-2xs text-ui-muted mt-2 numeric">
                    {formatDateTime(message.createdAt)}
                  </p>
                </div>
              </li>
            )
          })}
        </ol>
      )}
      <div ref={endRef} />

      <form onSubmit={send} className="flex flex-col gap-2 sticky bottom-0 bg-ui-canvas pt-2">
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder={t('messages.placeholder')}
          maxLength={MESSAGE_BODY_MAX_LENGTH}
          rows={3}
          className="input"
        />
        <button
          type="submit"
          disabled={sending || !isSendableBody(body)}
          className="btn-secondary self-end"
        >
          {sending ? t('messages.sending') : t('messages.send')}
          <Send className="w-4 h-4" aria-hidden="true" />
        </button>
      </form>
    </div>
  )
}
