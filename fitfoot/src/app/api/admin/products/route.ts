import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { products, productImages, productVariants } from '@/db/schema'
import { productCreateSchema } from '@/lib/validation/schemas'
import { requireStaff } from '@/lib/auth/guards'
import { chfToRappen } from '@/lib/money'
import { resolveProductSlug, resolveVariantSku } from '@/lib/catalog-admin'
import { decodeDataUrl, ImageError } from '@/lib/images'
import { handleRouteError, jsonError } from '@/lib/api'

/**
 * One save for the whole product: details, every size, and the photo all
 * land in a single transaction, so staff never juggles a multi-step wizard.
 */
export async function POST(request: Request) {
  try {
    await requireStaff()
    const input = productCreateSchema.parse(await request.json())
    const { priceChf, compareAtChf, imageDataUrl, variants, slug, ...rest } = input

    let image: { data: Buffer; mimeType: string } | null = null
    if (imageDataUrl) {
      try {
        image = decodeDataUrl(imageDataUrl)
      } catch (error) {
        if (error instanceof ImageError) return jsonError(400, error.message)
        throw error
      }
    }

    const resolvedSlug = await resolveProductSlug(input.name, slug)

    const created = await db.transaction(async (tx) => {
      const [product] = await tx
        .insert(products)
        .values({
          ...rest,
          slug: resolvedSlug,
          priceRappen: chfToRappen(priceChf),
          compareAtRappen: compareAtChf ? chfToRappen(compareAtChf) : null,
        })
        .returning()

      if (image) {
        await tx.insert(productImages).values({ productId: product.id, ...image })
        await tx
          .update(products)
          .set({ imageUrl: `/api/products/${product.id}/image` })
          .where(eq(products.id, product.id))
        product.imageUrl = `/api/products/${product.id}/image`
      }

      if (variants.length > 0) {
        const rows = []
        for (const v of variants) {
          const sku = await resolveVariantSku(resolvedSlug, v.size, v.color)
          rows.push({ ...v, sku, productId: product.id })
        }
        await tx.insert(productVariants).values(rows)
      }

      return product
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    return handleRouteError(error, 'admin/products POST')
  }
}
