'use server'

/**
 * Auth Server Actions — replace the old /api/auth/* REST routes. Called
 * directly from forms via useActionState, so pending/error state comes
 * from React instead of hand-rolled fetch+useState in every component.
 */
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '@/lib/validation/schemas'
import { registerCustomer, loginCustomer, FlowError } from '@/lib/auth/flows'
import { setSessionCookie, clearSessionCookie } from '@/lib/auth/session'
import { createResetToken, consumeResetToken } from '@/lib/auth/reset-tokens'
import { hashPassword } from '@/lib/auth/passwords'
import { sendEmail } from '@/lib/email'
import { db } from '@/db'
import { customers } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getClientIp, rateLimit } from '@/lib/rate-limit'
import type { ActionState } from './types'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3005'

async function clientIp(): Promise<string> {
  return getClientIp(await headers())
}

export async function registerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!rateLimit(`register:${await clientIp()}`, 5, 60 * 60 * 1000)) {
    return { error: 'Too many attempts. Please try again later.' }
  }
  const parsed = registerSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  let customer
  try {
    customer = await registerCustomer(parsed.data)
  } catch (error) {
    if (error instanceof FlowError) return { error: error.message }
    throw error
  }

  await setSessionCookie({ sub: customer.id, email: customer.email, role: customer.role })
  redirect('/account')
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!rateLimit(`login:${await clientIp()}`, 10, 15 * 60 * 1000)) {
    return { error: 'Too many attempts. Please try again later.' }
  }
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  let customer
  try {
    customer = await loginCustomer(parsed.data)
  } catch (error) {
    if (error instanceof FlowError) return { error: error.message }
    throw error
  }

  await setSessionCookie({ sub: customer.id, email: customer.email, role: customer.role })

  const next = formData.get('next')
  const fallback = customer.role === 'STAFF' || customer.role === 'ADMIN' ? '/admin' : '/account'
  redirect(typeof next === 'string' && next.startsWith('/') ? next : fallback)
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie()
  redirect('/')
}

/**
 * Always succeeds from the caller's point of view — whether or not the
 * email exists — so this can't be used to check who has an account.
 */
export async function forgotPasswordAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  if (!rateLimit(`forgot:${await clientIp()}`, 5, 60 * 60 * 1000)) {
    return { error: 'Too many attempts. Please try again later.' }
  }
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get('email') })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.email, parsed.data.email))
    .limit(1)

  if (customer?.passwordHash && customer.active) {
    const token = await createResetToken(customer.id)
    const resetUrl = `${APP_URL}/reset-password?token=${token}`
    await sendEmail(customer.email, 'passwordReset', resetUrl)
  }

  return { ok: true }
}

export async function resetPasswordAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  if (!rateLimit(`reset:${await clientIp()}`, 10, 60 * 60 * 1000)) {
    return { error: 'Too many attempts. Please try again later.' }
  }
  const password = formData.get('password')
  const confirm = formData.get('confirm')
  if (password !== confirm) {
    return { error: 'The passwords do not match.' }
  }
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get('token'),
    password,
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const customerId = await consumeResetToken(parsed.data.token)
  if (!customerId) {
    return { error: 'This link has expired or was already used. Please request a new one.' }
  }

  const passwordHash = await hashPassword(parsed.data.password)
  await db.update(customers).set({ passwordHash }).where(eq(customers.id, customerId))

  redirect('/login?reset=1')
}
