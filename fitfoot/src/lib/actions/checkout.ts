'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { checkoutSchema, contactSchema, newsletterSchema } from '@/lib/validation/schemas'
import { checkout, CheckoutError } from '@/lib/orders/checkout'
import { getCartId } from '@/lib/cart/server'
import { getSession } from '@/lib/auth/guards'
import { getClientIp, rateLimit } from '@/lib/rate-limit'
import { sendEmail } from '@/lib/email'
import { db } from '@/db'
import { contactInquiries, customers, newsletterSubscribers } from '@/db/schema'
import { eq } from 'drizzle-orm'
import type { ActionState } from './types'

async function clientIp(): Promise<string> {
  return getClientIp(await headers())
}

export async function checkoutAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!rateLimit(`checkout:${await clientIp()}`, 10, 60 * 60 * 1000)) {
    return { error: 'Too many attempts. Please try again later.' }
  }
  const parsed = checkoutSchema.safeParse({
    email: formData.get('email'),
    shipName: formData.get('shipName'),
    shipStreet: formData.get('shipStreet'),
    shipZip: formData.get('shipZip'),
    shipCity: formData.get('shipCity'),
    shipCountry: formData.get('shipCountry') || 'CH',
    shippingMethod: formData.get('shippingMethod') || 'STANDARD',
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Please check the form and try again.' }
  }

  const cartId = await getCartId()
  if (!cartId) return { error: 'Your cart is empty.' }

  const session = await getSession()
  let result
  try {
    result = await checkout({
      cartId,
      email: parsed.data.email,
      customerId: session?.sub ?? null,
      shipName: parsed.data.shipName,
      shipStreet: parsed.data.shipStreet,
      shipZip: parsed.data.shipZip,
      shipCity: parsed.data.shipCity,
      shipCountry: parsed.data.shipCountry,
      shippingMethod: parsed.data.shippingMethod,
    })
  } catch (error) {
    if (error instanceof CheckoutError) return { error: error.message }
    throw error
  }

  await sendEmail(parsed.data.email, 'orderConfirmation', result.orderNumber, result.totalRappen)
  redirect(`/checkout/success?order=${encodeURIComponent(result.orderNumber)}`)
}

export async function contactAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!rateLimit(`contact:${await clientIp()}`, 5, 60 * 60 * 1000)) {
    return { error: 'Too many requests. Please try again later.' }
  }
  const parsed = contactSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    subject: formData.get('subject'),
    message: formData.get('message'),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Please check the form and try again.' }
  }

  const [known] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.email, parsed.data.email))
    .limit(1)

  await db.insert(contactInquiries).values({
    name: parsed.data.name,
    email: parsed.data.email,
    subject: parsed.data.subject,
    message: parsed.data.message,
    customerId: known?.id ?? null,
  })
  return { ok: true }
}

export async function newsletterAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!rateLimit(`newsletter:${await clientIp()}`, 5, 60 * 60 * 1000)) {
    return { error: 'Too many requests. Please try again later.' }
  }
  const parsed = newsletterSchema.safeParse({ email: formData.get('email') })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Please enter a valid email.' }
  }

  await db
    .insert(newsletterSubscribers)
    .values({ email: parsed.data.email })
    .onConflictDoUpdate({
      target: newsletterSubscribers.email,
      set: { unsubscribedAt: null, subscribedAt: new Date() },
    })
  return { ok: true }
}
