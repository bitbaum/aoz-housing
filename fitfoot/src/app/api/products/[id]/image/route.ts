import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { productImages } from '@/db/schema'

/** Public — anyone browsing the shop needs to load product photos. */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const [image] = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, params.id))
    .limit(1)

  if (!image) {
    return new Response('Not found', { status: 404 })
  }

  return new Response(new Uint8Array(image.data), {
    headers: {
      'Content-Type': image.mimeType,
      'Cache-Control': 'public, max-age=300',
    },
  })
}
