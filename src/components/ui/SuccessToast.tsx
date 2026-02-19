'use client'

import { Suspense, useEffect } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { showToast } from './Toast'

interface ToastTrigger {
  /** URL search param to watch for (e.g. 'placed') */
  param: string
  /** Toast message to display when param is present */
  message: string
}

/**
 * Reads URL search params and shows a success toast when a trigger param is found.
 * Cleans up the param from the URL after showing the toast.
 * Mount on pages that are redirect targets for form submissions.
 *
 * Wraps itself in Suspense since useSearchParams() requires it in the App Router.
 */
export function SuccessToast({ triggers }: { triggers: ToastTrigger[] }) {
  return (
    <Suspense fallback={null}>
      <SuccessToastInner triggers={triggers} />
    </Suspense>
  )
}

function SuccessToastInner({ triggers }: { triggers: ToastTrigger[] }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    for (const trigger of triggers) {
      if (searchParams.get(trigger.param) === 'true') {
        showToast('success', trigger.message)
        // Clean up the URL param so toast doesn't re-fire on refresh
        const params = new URLSearchParams(searchParams.toString())
        params.delete(trigger.param)
        const newUrl = params.toString() ? `${pathname}?${params}` : pathname
        router.replace(newUrl, { scroll: false })
        break
      }
    }
  }, [searchParams, router, pathname, triggers])

  return null
}
