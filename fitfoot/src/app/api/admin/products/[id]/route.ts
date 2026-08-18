import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { products } from '@/db/schema'
import { productUpsertSchema } from '@/lib/validation/schemas'
import { requireStaff } from '@/lib/auth/guards'
import { chfToRappen } from '@/lib/money'
import { handleRouteError, jsonError } from '@/lib/api'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireStaff()
    const input = productUpsertSchema.partial().parse(await request.json())
    const { priceChf, compareAtChf, ...rest } = input
    const values: Record<string, unknown> = { ...rest }
    if (priceChf !== undefined) values.priceRappen = chfToRappen(priceChf)
    if (compareAtChf !== undefined) {
      values.compareAtRappen = compareAtChf ? chfToRappen(compareAtChf) : null
    }
    const [updated] = await db
      .update(products)
      .set(values)
      .where(eq(products.id, params.id))
      .returning()
    if (!updated) return jsonError(404, 'Product not found.')
    return NextResponse.json(updated)
  } catch (error) {
    return handleRouteError(error, 'admin/products PATCH')
  }
}

/** Deactivate, never hard-delete: order lines reference products. */
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    await requireStaff()
    const [updated] = await db
      .update(products)
      .set({ active: false })
      .where(eq(products.id, params.id))
      .returning()
    if (!updated) return jsonError(404, 'Product not found.')
    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleRouteError(error, 'admin/products DELETE')
  }
}
