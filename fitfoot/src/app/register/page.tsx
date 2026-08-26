import type { Metadata } from 'next'
import { RegisterForm } from '@/components/auth/RegisterForm'

export const metadata: Metadata = {
  title: 'Create account',
}

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="text-center font-heading text-3xl">Create your account</h1>
      <p className="mt-2 text-center text-sm text-muted">
        Track orders, faster checkout, trade-in status — all in one place.
      </p>
      <RegisterForm />
    </div>
  )
}
