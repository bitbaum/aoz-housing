import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { productVariants } from '@/db/schema'
import { variantUpsertSchema } from '@/lib/validation/schemas'
import { requireStaff } from '@/lib/auth/guards'
import { handleRouteError, jsonError } from '@/lib/api'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireStaff()
    const input = variantUpsertSchema.partial().parse(await request.json())
    const [updated] = await db
      .update(productVariants)
      .set(input)
      .where(eq(productVariants.id, params.id))
      .returning()
    if (!updated) return jsonError(404, 'Variant not found.')
    return NextResponse.json(updated)
  } catch (error) {
    return handleRouteError(error, 'admin/variants PATCH')
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    await requireStaff()
    const [deleted] = await db
      .delete(productVariants)
      .where(eq(productVariants.id, params.id))
      .returning()
    if (!deleted) return jsonError(404, 'Variant not found.')
    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleRouteError(error, 'admin/variants DELETE')
  }
}
