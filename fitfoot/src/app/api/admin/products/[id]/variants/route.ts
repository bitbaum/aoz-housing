import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { products, productVariants } from '@/db/schema'
import { variantUpsertSchema } from '@/lib/validation/schemas'
import { requireStaff } from '@/lib/auth/guards'
import { handleRouteError, jsonError } from '@/lib/api'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireStaff()
    const input = variantUpsertSchema.parse(await request.json())
    const [product] = await db.select().from(products).where(eq(products.id, params.id)).limit(1)
    if (!product) return jsonError(404, 'Product not found.')
    const [created] = await db
      .insert(productVariants)
      .values({ ...input, productId: params.id })
      .returning()
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    return handleRouteError(error, 'admin/products/variants POST')
  }
}
