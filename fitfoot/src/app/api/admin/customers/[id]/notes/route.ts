import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { crmNotes, customers } from '@/db/schema'
import { crmNoteSchema } from '@/lib/validation/schemas'
import { requireStaff } from '@/lib/auth/guards'
import { handleRouteError, jsonError } from '@/lib/api'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const staff = await requireStaff()
    const { id } = await params
    const input = crmNoteSchema.parse(await request.json())
    const [customer] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.id, id))
      .limit(1)
    if (!customer) return jsonError(404, 'Customer not found.')
    const [created] = await db
      .insert(crmNotes)
      .values({ customerId: id, authorId: staff.id, body: input.body })
      .returning()
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    return handleRouteError(error, 'admin/customers/notes POST')
  }
}
