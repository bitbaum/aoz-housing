'use client'

import { useState } from 'react'
import { Send } from 'lucide-react'
import { MESSAGES_LABELS } from '@/lib/constants/labels'
import { formatDateTime } from '@/lib/utils/formatting'
import { MESSAGE_BODY_MAX_LENGTH, isSendableBody, type MessageRow } from '@/lib/messaging/thread'

/**
 * The staff side of one conversation.
 *
 * Deliberately its own component rather than a shared one with the portal:
 * the two sides differ in who "mine" is, in which labels they use, and in
 * whether the copy is translated. A single component parameterised over all
 * three would be harder to read than two that each say one thing.
 */
export function StaffReplyThread({
  residentId,
  initialMessages,
}: {
  residentId: string
  initialMessages: MessageRow[]
}) {
  const [messages, setMessages] = useState(initialMessages)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [failed, setFailed] = useState(false)

  async function send(event: React.FormEvent) {
    event.preventDefault()
    if (!isSendableBody(body) || sending) return

    const text = body.trim()
    setSending(true)
    setFailed(false)

    try {
      const response = await fetch(`/api/messages/${residentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: text }),
      })
      const result = await response.json()
      if (!result.success) throw new Error(result.error)

      setMessages((current) => [...current, result.data.message])
      setBody('')
    } catch {
      // The text stays in the box. Clearing it optimistically would leave a
      // caseworker believing they had answered somebody they had not.
      setFailed(true)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-4">
      {messages.length === 0 ? (
        <p className="text-sm text-ui-muted py-6">{MESSAGES_LABELS.empty}</p>
      ) : (
        <ol className="space-y-3">
          {messages.map((message) => {
            const fromStaff = message.authorUserId !== null
            return (
              <li key={message.id} className={fromStaff ? 'flex justify-end' : 'flex justify-start'}>
                <div
                  className={`max-w-[85%] rounded-lg border p-3 ${
                    fromStaff ? 'bg-ui-subtle border-ui-border' : 'bg-ui-surface border-ui-border-strong'
                  }`}
                >
                  <p className="eyebrow">
                    {fromStaff ? MESSAGES_LABELS.fromStaff : MESSAGES_LABELS.fromResident}
                  </p>
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

      <form onSubmit={send} className="flex flex-col gap-2">
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder={MESSAGES_LABELS.replyPlaceholder}
          maxLength={MESSAGE_BODY_MAX_LENGTH}
          rows={3}
          className="input"
        />
        {failed && (
          <p role="alert" className="alert-error">
            {MESSAGES_LABELS.sendFailed}
          </p>
        )}
        <button
          type="submit"
          disabled={sending || !isSendableBody(body)}
          className="btn-secondary self-end"
        >
          {sending ? MESSAGES_LABELS.sending : MESSAGES_LABELS.send}
          <Send className="w-4 h-4" aria-hidden="true" />
        </button>
      </form>
    </div>
  )
}
