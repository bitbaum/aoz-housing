import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/db'
import { products, productImages } from '@/db/schema'
import { requireStaff } from '@/lib/auth/guards'
import { decodeDataUrl, ImageError } from '@/lib/images'
import { handleRouteError, jsonError } from '@/lib/api'

const uploadSchema = z.object({ imageDataUrl: z.string().trim().min(1).max(3_000_000) })

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireStaff()
    const { id } = await params
    const input = uploadSchema.parse(await request.json())

    const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1)
    if (!product) return jsonError(404, 'Product not found.')

    let image
    try {
      image = decodeDataUrl(input.imageDataUrl)
    } catch (error) {
      if (error instanceof ImageError) return jsonError(400, error.message)
      throw error
    }

    await db
      .insert(productImages)
      .values({ productId: id, ...image })
      .onConflictDoUpdate({
        target: productImages.productId,
        set: { data: image.data, mimeType: image.mimeType, updatedAt: new Date() },
      })

    const imageUrl = `/api/products/${id}/image`
    await db.update(products).set({ imageUrl }).where(eq(products.id, id))

    return NextResponse.json({ imageUrl })
  } catch (error) {
    return handleRouteError(error, 'admin/products/image POST')
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireStaff()
    const { id } = await params
    await db.delete(productImages).where(eq(productImages.productId, id))
    await db.update(products).set({ imageUrl: '' }).where(eq(products.id, id))
    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleRouteError(error, 'admin/products/image DELETE')
  }
}
