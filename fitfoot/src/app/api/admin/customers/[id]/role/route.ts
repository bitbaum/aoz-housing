import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { customers } from '@/db/schema'
import { customerRoleSchema } from '@/lib/validation/schemas'
import { requireAdmin } from '@/lib/auth/guards'
import { handleRouteError, jsonError } from '@/lib/api'
import { logger } from '@/lib/logger'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin()
    const { id } = await params
    if (admin.id === id) {
      return jsonError(409, 'You cannot change your own role.')
    }
    const input = customerRoleSchema.parse(await request.json())
    const [updated] = await db
      .update(customers)
      .set({ role: input.role })
      .where(eq(customers.id, id))
      .returning()
    if (!updated) return jsonError(404, 'Customer not found.')
    logger.info('Role changed', { customer: updated.email, role: input.role, by: admin.email })
    return NextResponse.json(updated)
  } catch (error) {
    return handleRouteError(error, 'admin/customers/role PATCH')
  }
}
