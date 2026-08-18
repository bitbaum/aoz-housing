'use client'

import { useState, type FormEvent } from 'react'

export function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setState('busy')
    setError('')
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setState('done')
    } else {
      setState('error')
      const body = (await res.json().catch(() => null)) as { error?: string } | null
      setError(body?.error ?? 'Could not send your message. Please try again.')
    }
  }

  if (state === 'done') {
    return (
      <div className="card-premium flex items-center justify-center text-center">
        <div>
          <p className="text-4xl" aria-hidden>
            ✉️
          </p>
          <h2 className="mt-3 font-heading text-2xl">Message sent</h2>
          <p className="mt-2 text-sm text-neutral-600">
            Thanks for reaching out — we&apos;ll get back to you within one business day.
          </p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="card-premium">
      <h2 className="font-heading text-2xl">Send us a message</h2>
      <div className="mt-6 space-y-4">
        <div>
          <label htmlFor="contact-name" className="label-field">
            Name
          </label>
          <input
            id="contact-name"
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="input-field"
          />
        </div>
        <div>
          <label htmlFor="contact-email" className="label-field">
            Email
          </label>
          <input
            id="contact-email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="your.email@example.com"
            className="input-field"
          />
        </div>
        <div>
          <label htmlFor="contact-subject" className="label-field">
            Subject
          </label>
          <input
            id="contact-subject"
            type="text"
            required
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            className="input-field"
          />
        </div>
        <div>
          <label htmlFor="contact-message" className="label-field">
            Message
          </label>
          <textarea
            id="contact-message"
            required
            rows={5}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder="Tell us how we can help you..."
            className="input-field"
          />
        </div>
        {error && <p className="text-sm font-medium text-red-600">{error}</p>}
        <button type="submit" disabled={state === 'busy'} className="btn-gold w-full">
          {state === 'busy' ? 'Sending…' : 'Send Message'}
        </button>
      </div>
    </form>
  )
}
