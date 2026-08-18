import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'

export const metadata: Metadata = {
  title: 'Choose a new password',
}

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="text-center font-heading text-3xl">Choose a new password</h1>
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </div>
  )
}
