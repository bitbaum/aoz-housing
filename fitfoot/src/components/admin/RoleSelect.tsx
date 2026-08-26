'use client'

import { useState, useTransition } from 'react'
import { CUSTOMER_ROLES } from '@/config/database'
import { updateCustomerRoleAction } from '@/lib/actions/crm'

export function RoleSelect({
  customerId,
  currentRole,
}: {
  customerId: string
  currentRole: string
}) {
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  function change(role: string) {
    if (!window.confirm(`Change this person's role to ${role}?`)) return
    setError('')
    startTransition(async () => {
      const result = await updateCustomerRoleAction(customerId, role)
      if (result.error) setError(result.error)
    })
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="role-select" className="text-sm text-muted">
        Role
      </label>
      <select
        id="role-select"
        disabled={pending}
        value={currentRole}
        onChange={(e) => change(e.target.value)}
        className="min-h-[44px] rounded border border-line px-3 py-2 text-sm"
      >
        {CUSTOMER_ROLES.map((role) => (
          <option key={role} value={role}>
            {role}
          </option>
        ))}
      </select>
      {error && <p className="text-sm font-medium text-error-text">{error}</p>}
    </div>
  )
}
