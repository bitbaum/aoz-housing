'use client'

import { Suspense, useEffect } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { showToast } from './Toast'

interface SuccessTrigger {
  /** Present as `?param=true` */
  param: string
  message: string
}

interface ErrorTrigger {
  /** Value of the `error` search param */
  code: string
  message: string
}

/**
 * Shows success/error toasts from URL params, then strips them so refresh
 * does not repeat the message. Mount once per surface (portal layout, etc.).
 */
export function UrlFeedbackToast({
  success = [],
  errors = [],
}: {
  success?: SuccessTrigger[]
  errors?: ErrorTrigger[]
}) {
  return (
    <Suspense fallback={null}>
      <UrlFeedbackToastInner success={success} errors={errors} />
    </Suspense>
  )
}

function UrlFeedbackToastInner({
  success,
  errors,
}: {
  success: SuccessTrigger[]
  errors: ErrorTrigger[]
}) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    let changed = false

    for (const trigger of success) {
      if (searchParams.get(trigger.param) === 'true') {
        showToast('success', trigger.message)
        params.delete(trigger.param)
        changed = true
        break
      }
    }

    if (!changed) {
      const errorCode = searchParams.get('error')
      if (errorCode) {
        const match = errors.find((entry) => entry.code === errorCode)
        if (match) {
          showToast('error', match.message)
          params.delete('error')
          changed = true
        }
      }
    }

    if (changed) {
      const newUrl = params.toString() ? `${pathname}?${params}` : pathname
      router.replace(newUrl, { scroll: false })
    }
  }, [searchParams, router, pathname, success, errors])

  return null
}
