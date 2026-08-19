'use client'

import { Suspense, useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ADMIN_URL_FEEDBACK_RULES } from '@/lib/config/admin-url-feedback'
import { showToast } from '@/components/ui/Toast'

/** Path-scoped URL feedback for staff surfaces (German copy). */
export function AdminUrlFeedback() {
  return (
    <Suspense fallback={null}>
      <AdminUrlFeedbackInner />
    </Suspense>
  )
}

function AdminUrlFeedbackInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    let matched = false

    for (const rule of ADMIN_URL_FEEDBACK_RULES) {
      if (!rule.pathPattern.test(pathname)) continue
      if (params.get(rule.param) !== 'true') continue

      showToast(rule.kind === 'error' ? 'error' : 'success', rule.message)
      params.delete(rule.param)
      matched = true
      break
    }

    if (!matched) return

    const newUrl = params.toString() ? `${pathname}?${params}` : pathname
    router.replace(newUrl, { scroll: false })
  }, [searchParams, router, pathname])

  return null
}
