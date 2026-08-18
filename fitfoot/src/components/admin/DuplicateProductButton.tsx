'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function DuplicateProductButton({ productId }: { productId: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function duplicate() {
    setBusy(true)
    const res = await fetch(`/api/admin/products/${productId}/duplicate`, { method: 'POST' })
    const body = (await res.json().catch(() => null)) as { id?: string } | null
    if (res.ok && body?.id) {
      router.push(`/admin/products/${body.id}`)
      router.refresh()
    }
    setBusy(false)
  }

  return (
    <button type="button" onClick={duplicate} disabled={busy} className="btn-ghost text-sm">
      {busy ? 'Copying…' : 'Duplicate'}
    </button>
  )
}
