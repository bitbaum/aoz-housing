'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { duplicateProductAction } from '@/lib/actions/products'

export function DuplicateProductButton({ productId }: { productId: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function duplicate() {
    startTransition(async () => {
      const result = await duplicateProductAction(productId)
      if (result.ok && result.data?.id) {
        router.push(`/admin/products/${result.data.id}`)
      }
    })
  }

  return (
    <button type="button" onClick={duplicate} disabled={pending} className="btn-ghost text-sm">
      {pending ? 'Copying…' : 'Duplicate'}
    </button>
  )
}
