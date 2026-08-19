import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { consumeRateLimit } from '@/lib/auth/rate-limit'
import { hasAIProvider } from '@/lib/ai/provider'
import { runStaffChat } from '@/lib/ai/staff-chat'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const requestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().max(8000),
  })).max(40),
})

export async function POST(request: Request) {
  if (!hasAIProvider()) {
    return NextResponse.json(
      {
        error:
          'KI-Assistent nicht konfiguriert. Bitte GROQ_API_KEY oder OPENROUTER_API_KEY setzen (siehe docs/INFRASTRUCTURE.md).',
      },
      { status: 503 }
    )
  }

  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
  }

  const rateCheck = consumeRateLimit(`ai-chat:${user.id}`)
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: `Zu viele Anfragen. Bitte warten Sie ${rateCheck.retryAfter} Sekunden.` },
      { status: 429 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 })
  }

  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 })
  }

  const { messages } = parsed.data
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const answer = await runStaffChat(messages)

        // Stream in chunks so the UI shows progress (WhatsApp-like responsiveness).
        const chunks = answer.match(/\S+\s*|\s+/g) ?? [answer]
        for (const chunk of chunks) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'text', text: chunk })}\n\n`)
          )
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`))
      } catch (err) {
        logger.errorWithCause('AI chat failed', err)
        const message =
          err instanceof Error && err.message
            ? err.message
            : 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.'
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'error', message })}\n\n`)
        )
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
