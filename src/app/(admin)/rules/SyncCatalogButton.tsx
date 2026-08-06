import { BRAND } from '@/lib/config/brand'
'use client'

import { useState, useTransition } from 'react'
import { RefreshCw } from 'lucide-react'
import { syncOrgRuleCatalog } from '@/lib/actions/governance'

/**
 * Loads (or reloads) the AOZ baseline catalog.
 *
 * Idempotent: unchanged rules are left alone, changed wording bumps the rule's
 * version — which asks every resident bound by it to read it again. The result
 * message says how many, because "amended 3 rules" quietly means "everyone in
 * every house now has 3 things to re-confirm".
 */
export function SyncCatalogButton() {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)

  function handleSync() {
    startTransition(async () => {
      const result = await syncOrgRuleCatalog()
      setMessage(
        result.success
          ? `${result.data?.created ?? 0} neu, ${result.data?.amended ?? 0} geändert`
          : result.error
      )
    })
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleSync}
        disabled={isPending}
        className="btn-secondary inline-flex min-h-[44px] items-center gap-2"
      >
        <RefreshCw className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`} aria-hidden="true" />
        {isPending ? 'Wird abgeglichen…' : `${BRAND.shortName}-Katalog abgleichen`}
      </button>
      {message && (
        <p className="text-sm text-ui-muted" role="status">
          {message}
        </p>
      )}
    </div>
  )
}
