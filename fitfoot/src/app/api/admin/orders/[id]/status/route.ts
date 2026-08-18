import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { orders } from '@/db/schema'
import { orderStatusSchema } from '@/lib/validation/schemas'
import { requireStaff } from '@/lib/auth/guards'
import { canTransition, isOrderStatus } from '@/lib/orders/status'
import { handleRouteError, jsonError } from '@/lib/api'
import { logger } from '@/lib/logger'
import { sendEmail } from '@/lib/email'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const staff = await requireStaff()
    const { id } = await params
    const input = orderStatusSchema.parse(await request.json())

    const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1)
    if (!order) return jsonError(404, 'Order not found.')
    if (!isOrderStatus(order.status)) return jsonError(500, 'Order has an unknown status.')

    if (!canTransition(order.status, input.status)) {
      return jsonError(409, `Cannot move an order from ${order.status} to ${input.status}.`)
    }

    const [updated] = await db
      .update(orders)
      .set({ status: input.status })
      .where(eq(orders.id, id))
      .returning()

    logger.info('Order status changed', {
      orderNumber: order.orderNumber,
      from: order.status,
      to: input.status,
      by: staff.email,
    })
    if (input.status === 'SHIPPED') {
      await sendEmail(order.email, 'orderShipped', order.orderNumber)
    }
    return NextResponse.json(updated)
  } catch (error) {
    return handleRouteError(error, 'admin/orders/status PATCH')
  }
}
