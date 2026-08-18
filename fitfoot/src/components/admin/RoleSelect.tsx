'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CUSTOMER_ROLES } from '@/config/database'

export function RoleSelect({
  customerId,
  currentRole,
}: {
  customerId: string
  currentRole: string
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function change(role: string) {
    if (!window.confirm(`Change this person's role to ${role}?`)) return
    setBusy(true)
    setError('')
    const res = await fetch(`/api/admin/customers/${customerId}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })
    if (res.ok) {
      router.refresh()
    } else {
      const body = (await res.json().catch(() => null)) as { error?: string } | null
      setError(body?.error ?? 'Could not change the role.')
    }
    setBusy(false)
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="role-select" className="text-sm text-neutral-500">
        Role
      </label>
      <select
        id="role-select"
        disabled={busy}
        value={currentRole}
        onChange={(e) => change(e.target.value)}
        className="min-h-[44px] rounded border border-neutral-300 px-3 py-2 text-sm"
      >
        {CUSTOMER_ROLES.map((role) => (
          <option key={role} value={role}>
            {role}
          </option>
        ))}
      </select>
      {error && <p className="text-sm font-medium text-red-600">{error}</p>}
    </div>
  )
}
