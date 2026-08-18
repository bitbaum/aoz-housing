import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { contactInquiries } from '@/db/schema'
import { inquiryStatusSchema } from '@/lib/validation/schemas'
import { requireStaff } from '@/lib/auth/guards'
import { handleRouteError, jsonError } from '@/lib/api'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireStaff()
    const input = inquiryStatusSchema.parse(await request.json())
    const [updated] = await db
      .update(contactInquiries)
      .set({ status: input.status })
      .where(eq(contactInquiries.id, params.id))
      .returning()
    if (!updated) return jsonError(404, 'Inquiry not found.')
    return NextResponse.json(updated)
  } catch (error) {
    return handleRouteError(error, 'admin/inquiries PATCH')
  }
}
