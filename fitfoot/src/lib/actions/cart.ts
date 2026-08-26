'use server'

import { revalidatePath } from 'next/cache'
import { cartAddSchema, cartUpdateSchema } from '@/lib/validation/schemas'
import { addToCart, getOrCreateCartId, getCartId, updateCartItem } from '@/lib/cart/server'
import type { ActionState } from './types'

export async function addToCartAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = cartAddSchema.safeParse({
    variantId: formData.get('variantId'),
    quantity: formData.get('quantity'),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid selection.' }
  }
  const cartId = await getOrCreateCartId()
  await addToCart(cartId, parsed.data.variantId, parsed.data.quantity)
  revalidatePath('/', 'layout')
  return { ok: true }
}

export async function updateCartItemAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = cartUpdateSchema.safeParse({
    itemId: formData.get('itemId'),
    quantity: formData.get('quantity'),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid request.' }
  }
  const cartId = await getCartId()
  if (!cartId) return { error: 'No cart found.' }
  await updateCartItem(cartId, parsed.data.itemId, parsed.data.quantity)
  revalidatePath('/', 'layout')
  return { ok: true }
}
