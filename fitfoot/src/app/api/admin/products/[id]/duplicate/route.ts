import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { products, productImages, productVariants } from '@/db/schema'
import { requireStaff } from '@/lib/auth/guards'
import { resolveProductSlug, resolveVariantSku } from '@/lib/catalog-admin'
import { handleRouteError, jsonError } from '@/lib/api'

/**
 * Clone an existing product — for the common case of "same shoe, new
 * colorway". The copy starts INACTIVE (a draft) so it can't accidentally
 * go live with the wrong details, and stock starts at zero.
 */
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    await requireStaff()
    const [original] = await db.select().from(products).where(eq(products.id, params.id)).limit(1)
    if (!original) return jsonError(404, 'Product not found.')

    const variants = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, params.id))

    const [image] = await db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, params.id))
      .limit(1)

    const newSlug = await resolveProductSlug(`${original.name} copy`)

    const copy = await db.transaction(async (tx) => {
      const [product] = await tx
        .insert(products)
        .values({
          slug: newSlug,
          name: `${original.name} (Copy)`,
          category: original.category,
          productType: original.productType,
          conditionGrade: original.conditionGrade,
          brand: original.brand,
          gender: original.gender,
          shortDescription: original.shortDescription,
          description: original.description,
          materials: original.materials,
          careInstructions: original.careInstructions,
          origin: original.origin,
          sustainabilityNotes: original.sustainabilityNotes,
          sustainabilityFeatures: original.sustainabilityFeatures,
          priceRappen: original.priceRappen,
          compareAtRappen: original.compareAtRappen,
          active: false,
        })
        .returning()

      if (image) {
        await tx.insert(productImages).values({
          productId: product.id,
          data: image.data,
          mimeType: image.mimeType,
        })
        await tx
          .update(products)
          .set({ imageUrl: `/api/products/${product.id}/image` })
          .where(eq(products.id, product.id))
      }

      for (const v of variants) {
        const sku = await resolveVariantSku(newSlug, v.size, v.color)
        await tx.insert(productVariants).values({
          productId: product.id,
          sku,
          size: v.size,
          color: v.color,
          stockQty: 0,
        })
      }

      return product
    })

    return NextResponse.json({ id: copy.id }, { status: 201 })
  } catch (error) {
    return handleRouteError(error, 'admin/products/duplicate POST')
  }
}
