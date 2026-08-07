import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { consumeRateLimit } from '@/lib/auth/rate-limit'
import { getAnthropic, getAnthropicModel, hasAnthropicKey } from '@/lib/ai/anthropic'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import { BRAND } from '@/lib/config/brand'

/** Server-side cap on per-tool result size, regardless of what the LLM asks for. */
const MAX_TOOL_LIMIT = 25

const requestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().max(8000),
  })).max(40),
})

// Per-tool input schemas. The LLM can produce any JSON; we validate at the
// boundary before touching Prisma, preventing prompt-injection from steering
// queries with unbounded strings or invalid enum values.
const searchResidentsInputSchema = z.object({
  code: z.string().max(50).optional(),
  status: z.enum(['ACTIVE', 'PLACED', 'TRANSFERRED', 'EXITED']).optional(),
  limit: z.number().int().positive().max(MAX_TOOL_LIMIT).optional(),
})
const housingUnitsInputSchema = z.object({
  hasCapacity: z.boolean().optional(),
  limit: z.number().int().positive().max(MAX_TOOL_LIMIT).optional(),
})
const recentIncidentsInputSchema = z.object({
  category: z.enum(['INTERPERSONAL', 'MAINTENANCE', 'SAFETY', 'WELLBEING']).optional(),
  unresolved: z.boolean().optional(),
  limit: z.number().int().positive().max(MAX_TOOL_LIMIT).optional(),
})

const SYSTEM_PROMPT = `Du bist ein KI-Assistent für das ${BRAND.shortName} Wohnungsmanagementsystem.

Deine Aufgabe: Mitarbeitenden dabei helfen, Informationen über Bewohner, Unterkünfte, Platzierungen und Vorfälle schnell zu finden und zu analysieren.

Das System platziert Asylsuchende in Gemeinschaftsunterkünften basierend auf Kompatibilität, um Konflikte zu reduzieren und das Wohlbefinden zu fördern.

Verfügbare Werkzeuge:
- get_dashboard_stats: Systemweite Übersichtsstatistiken
- search_residents: Bewohner nach Code oder Status suchen
- get_housing_units: Wohneinheiten mit Belegungsinformationen
- get_recent_incidents: Aktuelle Vorfälle und Konflikte

Verhaltensregeln:
- Antworte immer auf Deutsch
- Sei präzise und direkt — Mitarbeitende brauchen schnelle Antworten
- Verwende Werkzeuge proaktiv, um aktuelle Daten zu zeigen
- Respektiere die Würde der Bewohner in deiner Sprache
- Gib nur arbeitsbezogene Informationen weiter`

const tools: Anthropic.Tool[] = [
  {
    name: 'get_dashboard_stats',
    description: 'Gibt aktuelle Systemstatistiken zurück: Bewohnerzahlen, Belegungsrate, offene Vorfälle, ausstehende Verlegungen.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'search_residents',
    description: 'Sucht Bewohner nach Code oder Status. Gibt Code, Status, Sprachen und aktuelle Unterkunft zurück.',
    input_schema: {
      type: 'object',
      properties: {
        code: { type: 'string', description: 'Bewohnercode oder Teilstring (z.B. "RES-A")' },
        status: {
          type: 'string',
          enum: ['ACTIVE', 'PLACED', 'TRANSFERRED', 'EXITED'],
          description: 'Status filtern',
        },
        limit: { type: 'number', description: 'Max. Ergebnisse (Standard: 10)' },
      },
      required: [],
    },
  },
  {
    name: 'get_housing_units',
    description: 'Listet Wohneinheiten mit aktueller Belegung auf. Zeigt freie Betten und offene Wartungsanfragen.',
    input_schema: {
      type: 'object',
      properties: {
        hasCapacity: { type: 'boolean', description: 'Nur Einheiten mit freien Plätzen' },
        limit: { type: 'number', description: 'Max. Ergebnisse (Standard: 10)' },
      },
      required: [],
    },
  },
  {
    name: 'get_recent_incidents',
    description: 'Gibt aktuelle Vorfälle zurück. Kann nach Kategorie und Lösungsstatus gefiltert werden.',
    input_schema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: ['INTERPERSONAL', 'MAINTENANCE', 'SAFETY', 'WELLBEING'],
          description: 'Vorfallskategorie',
        },
        unresolved: { type: 'boolean', description: 'Nur offene Vorfälle' },
        limit: { type: 'number', description: 'Max. Ergebnisse (Standard: 10)' },
      },
      required: [],
    },
  },
]

async function executeTool(name: string, rawInput: unknown): Promise<unknown> {
  switch (name) {
    case 'get_dashboard_stats': {
      const [totalResidents, activePlacements, totalUnits, openIncidents, pendingTransfers] = await Promise.all([
        prisma.resident.count(),
        prisma.placement.count({ where: { status: 'ACTIVE' } }),
        prisma.housingUnit.count(),
        prisma.incident.count({ where: { resolvedAt: null } }),
        prisma.transferRequest.count({ where: { status: 'PENDING' } }),
      ])
      return {
        totalResidents,
        activePlacements,
        totalUnits,
        openIncidents,
        pendingTransfers,
        occupancyRate: totalUnits > 0 ? `${Math.round((activePlacements / totalUnits) * 100)}%` : '0%',
      }
    }

    case 'search_residents': {
      const parsed = searchResidentsInputSchema.safeParse(rawInput)
      if (!parsed.success) return { error: 'Ungültige Eingabe' }
      const input = parsed.data

      const where: Record<string, unknown> = {}
      if (input.code) where.code = { contains: input.code.toUpperCase() }
      if (input.status) where.status = input.status

      const residents = await prisma.resident.findMany({
        where,
        select: {
          code: true,
          status: true,
          languages: true,
          placements: {
            where: { status: 'ACTIVE' },
            select: { housingUnit: { select: { code: true, address: true } } },
            take: 1,
          },
        },
        take: Math.min(input.limit ?? 10, MAX_TOOL_LIMIT),
        orderBy: { createdAt: 'desc' },
      })
      return residents.map(r => ({
        code: r.code,
        status: r.status,
        languages: r.languages,
        currentUnit: r.placements[0]?.housingUnit?.code ?? null,
        unitAddress: r.placements[0]?.housingUnit?.address ?? null,
      }))
    }

    case 'get_housing_units': {
      const parsed = housingUnitsInputSchema.safeParse(rawInput)
      if (!parsed.success) return { error: 'Ungültige Eingabe' }
      const input = parsed.data

      const units = await prisma.housingUnit.findMany({
        select: {
          code: true,
          address: true,
          totalBeds: true,
          placements: { where: { status: 'ACTIVE' }, select: { id: true } },
          incidents: { where: { resolvedAt: null }, select: { id: true } },
          maintenanceRequests: { where: { status: { in: ['OPEN', 'IN_PROGRESS'] } }, select: { id: true } },
        },
        take: Math.min(input.limit ?? 10, MAX_TOOL_LIMIT),
        orderBy: { code: 'asc' },
      })
      const result = units.map(u => ({
        code: u.code,
        address: u.address,
        totalBeds: u.totalBeds,
        occupied: u.placements.length,
        freeBeds: u.totalBeds - u.placements.length,
        openIncidents: u.incidents.length,
        pendingMaintenance: u.maintenanceRequests.length,
      }))
      return input.hasCapacity ? result.filter(u => u.freeBeds > 0) : result
    }

    case 'get_recent_incidents': {
      const parsed = recentIncidentsInputSchema.safeParse(rawInput)
      if (!parsed.success) return { error: 'Ungültige Eingabe' }
      const input = parsed.data

      const where: Record<string, unknown> = {}
      if (input.category) where.category = input.category
      if (input.unresolved) where.resolvedAt = null

      const incidents = await prisma.incident.findMany({
        where,
        select: {
          type: true,
          category: true,
          severity: true,
          date: true,
          resolvedAt: true,
          housingUnit: { select: { code: true } },
        },
        orderBy: { date: 'desc' },
        take: Math.min(input.limit ?? 10, MAX_TOOL_LIMIT),
      })
      // NOTE: we deliberately drop `description` and the unit `address` from the
      // response so the LLM can't be coaxed into reading free-text PII or
      // exposing exact resident locations.
      return incidents.map(i => ({
        type: i.type,
        category: i.category,
        severity: i.severity,
        date: i.date.toISOString().split('T')[0],
        resolved: !!i.resolvedAt,
        unit: i.housingUnit?.code ?? null,
      }))
    }

    default:
      return { error: `Unbekanntes Werkzeug: ${name}` }
  }
}

export async function POST(request: Request) {
  const anthropicModel = await getAnthropicModel()
  if (!hasAnthropicKey()) {
    return NextResponse.json({ error: 'KI-Assistent nicht konfiguriert (ANTHROPIC_API_KEY fehlt).' }, { status: 503 })
  }

  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
  }

  // Throttle per user: the endpoint streams to Anthropic with up to 5 tool
  // iterations × 8192 tokens. Unbounded calls are an abuse / billing risk.
  //
  // `consume`, not `check`: checkRateLimit only reads the counter, and nothing
  // on this path ever incremented it, so this throttle could not trip no matter
  // how many requests one user made. Every call here is metered, so every call
  // counts — there is no failed-vs-successful distinction to make.
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
        const currentMessages: Anthropic.MessageParam[] = messages.map(m => ({
          role: m.role,
          content: m.content,
        }))

        const MAX_ITERATIONS = 5
        let iterations = 0

        while (iterations < MAX_ITERATIONS) {
          iterations++

          const sdkStream = getAnthropic().messages.stream({
            model: anthropicModel,
            max_tokens: 8192,
            thinking: { type: 'adaptive' },
            system: [{
              type: 'text',
              text: SYSTEM_PROMPT,
              cache_control: { type: 'ephemeral' },
            }],
            tools,
            messages: currentMessages,
          })

          for await (const event of sdkStream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              controller.enqueue(encoder.encode(
                `data: ${JSON.stringify({ type: 'text', text: event.delta.text })}\n\n`
              ))
            }
          }

          const finalMessage = await sdkStream.finalMessage()

          if (finalMessage.stop_reason !== 'tool_use') break

          const toolResults: Anthropic.ToolResultBlockParam[] = []
          for (const block of finalMessage.content) {
            if (block.type === 'tool_use') {
              const result = await executeTool(block.name, block.input)
              toolResults.push({
                type: 'tool_result',
                tool_use_id: block.id,
                content: JSON.stringify(result, null, 2),
              })
            }
          }

          currentMessages.push({ role: 'assistant', content: finalMessage.content })
          currentMessages.push({ role: 'user', content: toolResults })
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`))
      } catch (err) {
        logger.errorWithCause('AI chat stream failed', err)
        controller.enqueue(encoder.encode(
          `data: ${JSON.stringify({ type: 'error', message: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' })}\n\n`
        ))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
