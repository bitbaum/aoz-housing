import { NextResponse } from 'next/server'
import { db } from '@/db'
import { products } from '@/db/schema'
import { productUpsertSchema } from '@/lib/validation/schemas'
import { requireStaff } from '@/lib/auth/guards'
import { chfToRappen } from '@/lib/money'
import { handleRouteError } from '@/lib/api'

export async function POST(request: Request) {
  try {
    await requireStaff()
    const input = productUpsertSchema.parse(await request.json())
    const { priceChf, compareAtChf, ...rest } = input
    const [created] = await db
      .insert(products)
      .values({
        ...rest,
        priceRappen: chfToRappen(priceChf),
        compareAtRappen: compareAtChf ? chfToRappen(compareAtChf) : null,
      })
      .returning()
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    return handleRouteError(error, 'admin/products POST')
  }
}
