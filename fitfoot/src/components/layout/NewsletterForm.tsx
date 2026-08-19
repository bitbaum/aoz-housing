'use client'

import { useState, type FormEvent } from 'react'

export function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle')

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setState('busy')
    const res = await fetch('/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    setState(res.ok ? 'done' : 'error')
  }

  if (state === 'done') {
    return <p className="mt-3 text-sm font-medium text-success-text">Thanks — you&apos;re on the list!</p>
  }

  return (
    <form onSubmit={onSubmit} className="mt-3 flex gap-2">
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <input
        id="newsletter-email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your.email@example.com"
        className="input-field text-sm"
      />
      <button type="submit" disabled={state === 'busy'} className="btn-gold px-4 text-sm">
        Subscribe
      </button>
    </form>
  )
}
