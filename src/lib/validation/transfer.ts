import { z } from 'zod'
import { idSchema } from './schemas'

export const CreateTransferRequestSchema = z.object({
  reason: z.string().min(10, 'Bitte einen Grund angeben (mind. 10 Zeichen)'),
  targetUnitId: z.string().optional(),
})

export const ReviewTransferRequestSchema = z.object({
  requestId: idSchema,
  staffNotes: z.string().optional(),
})

export type CreateTransferRequestInput = z.infer<typeof CreateTransferRequestSchema>
export type ReviewTransferRequestInput = z.infer<typeof ReviewTransferRequestSchema>
