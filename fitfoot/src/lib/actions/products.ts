'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/db'
import { products, productImages, productVariants } from '@/db/schema'
import {
  productCreateSchema,
  productUpsertSchema,
  variantUpsertSchema,
} from '@/lib/validation/schemas'
import { requireStaff } from '@/lib/auth/guards'
import { chfToRappen } from '@/lib/money'
import { resolveProductSlug, resolveVariantSku } from '@/lib/catalog-admin'
import { decodeDataUrl, ImageError } from '@/lib/images'
import type { ActionState } from './types'

const uploadImageSchema = z.object({ imageDataUrl: z.string().trim().min(1).max(3_000_000) })

function nullableString(value: FormDataEntryValue | null): string | null {
  const s = typeof value === 'string' ? value.trim() : ''
  return s ? s : null
}

/** Shared FormData -> object mapping for both create and update. */
function productInput(formData: FormData) {
  return {
    slug: nullableString(formData.get('slug')) ?? undefined,
    name: formData.get('name'),
    category: formData.get('category'),
    productType: formData.get('productType'),
    conditionGrade: nullableString(formData.get('conditionGrade')),
    brand: formData.get('brand'),
    gender: formData.get('gender'),
    shortDescription: formData.get('shortDescription'),
    description: formData.get('description'),
    materials: formData.get('materials'),
    careInstructions: formData.get('careInstructions'),
    origin: formData.get('origin'),
    sustainabilityNotes: formData.get('sustainabilityNotes'),
    sustainabilityFeatures: formData.getAll('sustainabilityFeatures'),
    priceChf: formData.get('priceChf'),
    compareAtChf: nullableString(formData.get('compareAtChf')),
    imageUrl: formData.get('imageUrl') ?? '',
    active: formData.get('active') === 'true',
  }
}

/**
 * One save for the whole product: details, every size, and the photo all
 * land in a single transaction, so staff never juggles a multi-step wizard.
 */
export async function createProductAction(
  _prev: ActionState<{ id: string }>,
  formData: FormData
): Promise<ActionState<{ id: string }>> {
  await requireStaff()

  let variants: unknown
  try {
    variants = JSON.parse(String(formData.get('variantsJson') ?? '[]'))
  } catch {
    return { error: 'Could not read the size list.' }
  }

  const parsed = productCreateSchema.safeParse({
    ...productInput(formData),
    imageDataUrl: nullableString(formData.get('imageDataUrl')),
    variants,
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Please check the form and try again.' }
  }

  const { priceChf, compareAtChf, imageDataUrl, variants: variantInputs, slug, ...rest } = parsed.data

  let image: { data: Buffer; mimeType: string } | null = null
  if (imageDataUrl) {
    try {
      image = decodeDataUrl(imageDataUrl)
    } catch (error) {
      if (error instanceof ImageError) return { error: error.message }
      throw error
    }
  }

  const resolvedSlug = await resolveProductSlug(parsed.data.name, slug)

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
    }

    if (variantInputs.length > 0) {
      const rows = []
      for (const v of variantInputs) {
        const sku = await resolveVariantSku(resolvedSlug, v.size, v.color)
        rows.push({ ...v, sku, productId: product.id })
      }
      await tx.insert(productVariants).values(rows)
    }

    return product
  })

  revalidatePath('/admin', 'layout')
  return { ok: true, data: { id: created.id } }
}

export async function updateProductAction(
  productId: string,
  _prev: ActionState<{ id: string }>,
  formData: FormData
): Promise<ActionState<{ id: string }>> {
  await requireStaff()
  const parsed = productUpsertSchema.partial().safeParse(productInput(formData))
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Please check the form and try again.' }
  }

  const { priceChf, compareAtChf, imageDataUrl: _ignored, slug, ...rest } = parsed.data
  const values: Record<string, unknown> = { ...rest }
  if (priceChf !== undefined) values.priceRappen = chfToRappen(priceChf)
  if (compareAtChf !== undefined) {
    values.compareAtRappen = compareAtChf ? chfToRappen(compareAtChf) : null
  }
  // A blank slug means "leave it alone" — never write an empty URL.
  if (slug) values.slug = slug

  const [updated] = await db.update(products).set(values).where(eq(products.id, productId)).returning()
  if (!updated) return { error: 'Product not found.' }
  revalidatePath('/admin', 'layout')
  return { ok: true }
}

/**
 * Clone an existing product — for the common case of "same shoe, new
 * colorway". The copy starts INACTIVE (a draft) so it can't accidentally
 * go live with the wrong details, and stock starts at zero.
 */
export async function duplicateProductAction(
  productId: string
): Promise<ActionState<{ id: string }>> {
  await requireStaff()
  const [original] = await db.select().from(products).where(eq(products.id, productId)).limit(1)
  if (!original) return { error: 'Product not found.' }

  const variants = await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, productId))

  const [image] = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, productId))
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

  revalidatePath('/admin', 'layout')
  return { ok: true, data: { id: copy.id } }
}

export async function uploadProductImageAction(
  productId: string,
  _prev: ActionState<{ imageUrl: string }>,
  formData: FormData
): Promise<ActionState<{ imageUrl: string }>> {
  await requireStaff()
  const parsed = uploadImageSchema.safeParse({ imageDataUrl: formData.get('imageDataUrl') })
  if (!parsed.success) return { error: 'Could not read that photo.' }

  const [product] = await db.select().from(products).where(eq(products.id, productId)).limit(1)
  if (!product) return { error: 'Product not found.' }

  let image
  try {
    image = decodeDataUrl(parsed.data.imageDataUrl)
  } catch (error) {
    if (error instanceof ImageError) return { error: error.message }
    throw error
  }

  await db
    .insert(productImages)
    .values({ productId, ...image })
    .onConflictDoUpdate({
      target: productImages.productId,
      set: { data: image.data, mimeType: image.mimeType, updatedAt: new Date() },
    })

  const imageUrl = `/api/products/${productId}/image`
  await db.update(products).set({ imageUrl }).where(eq(products.id, productId))

  revalidatePath('/admin', 'layout')
  return { ok: true, data: { imageUrl } }
}

export async function deleteProductImageAction(productId: string): Promise<ActionState> {
  await requireStaff()
  await db.delete(productImages).where(eq(productImages.productId, productId))
  await db.update(products).set({ imageUrl: '' }).where(eq(products.id, productId))
  revalidatePath('/admin', 'layout')
  return { ok: true }
}

export async function createVariantAction(
  productId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireStaff()
  const parsed = variantUpsertSchema.safeParse({
    size: formData.get('size'),
    color: formData.get('color'),
    stockQty: formData.get('stockQty'),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Could not add the size.' }
  }
  const [product] = await db.select().from(products).where(eq(products.id, productId)).limit(1)
  if (!product) return { error: 'Product not found.' }

  const sku = await resolveVariantSku(product.slug, parsed.data.size, parsed.data.color, parsed.data.sku)
  await db.insert(productVariants).values({ ...parsed.data, sku, productId })
  revalidatePath('/admin', 'layout')
  return { ok: true }
}

export async function updateVariantStockAction(
  variantId: string,
  stockQty: number
): Promise<ActionState> {
  await requireStaff()
  if (!Number.isInteger(stockQty) || stockQty < 0) return { error: 'Invalid stock quantity.' }
  const [updated] = await db
    .update(productVariants)
    .set({ stockQty })
    .where(eq(productVariants.id, variantId))
    .returning()
  if (!updated) return { error: 'Variant not found.' }
  revalidatePath('/admin', 'layout')
  return { ok: true }
}

export async function deleteVariantAction(variantId: string): Promise<ActionState> {
  await requireStaff()
  const [deleted] = await db
    .delete(productVariants)
    .where(eq(productVariants.id, variantId))
    .returning()
  if (!deleted) return { error: 'Variant not found.' }
  revalidatePath('/admin', 'layout')
  return { ok: true }
}
