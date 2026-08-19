'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { crmNotes, customers, orders, contactInquiries } from '@/db/schema'
import {
  crmNoteSchema,
  customerRoleSchema,
  orderStatusSchema,
  inquiryStatusSchema,
} from '@/lib/validation/schemas'
import { requireStaff, requireAdmin } from '@/lib/auth/guards'
import { canTransition, isOrderStatus } from '@/lib/orders/status'
import { logger } from '@/lib/logger'
import { sendEmail } from '@/lib/email'
import type { ActionState } from './types'

export async function addCrmNoteAction(
  customerId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const staff = await requireStaff()
  const parsed = crmNoteSchema.safeParse({ body: formData.get('body') })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Could not save the note.' }
  }
  const [customer] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.id, customerId))
    .limit(1)
  if (!customer) return { error: 'Customer not found.' }
  await db.insert(crmNotes).values({ customerId, authorId: staff.id, body: parsed.data.body })
  revalidatePath('/admin', 'layout')
  return { ok: true }
}

export async function updateCustomerRoleAction(
  customerId: string,
  role: string
): Promise<ActionState> {
  const admin = await requireAdmin()
  if (admin.id === customerId) {
    return { error: 'You cannot change your own role.' }
  }
  const parsed = customerRoleSchema.safeParse({ role })
  if (!parsed.success) return { error: 'Invalid role.' }

  const [updated] = await db
    .update(customers)
    .set({ role: parsed.data.role })
    .where(eq(customers.id, customerId))
    .returning()
  if (!updated) return { error: 'Customer not found.' }
  logger.info('Role changed', { customer: updated.email, role: parsed.data.role, by: admin.email })
  revalidatePath('/admin', 'layout')
  return { ok: true }
}

export async function updateOrderStatusAction(orderId: string, status: string): Promise<ActionState> {
  const staff = await requireStaff()
  const parsed = orderStatusSchema.safeParse({ status })
  if (!parsed.success) return { error: 'Invalid status.' }

  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1)
  if (!order) return { error: 'Order not found.' }
  if (!isOrderStatus(order.status)) return { error: 'Order has an unknown status.' }
  if (!canTransition(order.status, parsed.data.status)) {
    return { error: `Cannot move an order from ${order.status} to ${parsed.data.status}.` }
  }

  await db.update(orders).set({ status: parsed.data.status }).where(eq(orders.id, orderId))

  logger.info('Order status changed', {
    orderNumber: order.orderNumber,
    from: order.status,
    to: parsed.data.status,
    by: staff.email,
  })
  if (parsed.data.status === 'SHIPPED') {
    await sendEmail(order.email, 'orderShipped', order.orderNumber)
  }
  revalidatePath('/admin', 'layout')
  return { ok: true }
}

export async function updateInquiryStatusAction(
  inquiryId: string,
  status: string
): Promise<ActionState> {
  await requireStaff()
  const parsed = inquiryStatusSchema.safeParse({ status })
  if (!parsed.success) return { error: 'Invalid status.' }

  const [updated] = await db
    .update(contactInquiries)
    .set({ status: parsed.data.status })
    .where(eq(contactInquiries.id, inquiryId))
    .returning()
  if (!updated) return { error: 'Inquiry not found.' }
  revalidatePath('/admin', 'layout')
  return { ok: true }
}
