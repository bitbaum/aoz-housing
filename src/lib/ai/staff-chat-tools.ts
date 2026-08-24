import { z } from 'zod'
import { prisma } from '@/lib/db'

/** Server-side cap on per-tool result size, regardless of what the LLM asks for. */
export const MAX_TOOL_LIMIT = 25

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

/** OpenAI-compatible tool definitions for the staff assistant. */
export const STAFF_CHAT_TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'get_dashboard_stats',
      description:
        'Gibt aktuelle Systemstatistiken zurück: Klient*innen-Zahlen, Belegungsrate, offene Vorfälle, ausstehende Verlegungen.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'search_residents',
      description:
        'Sucht Klient*innen nach Code oder Status. Gibt Code, Status, Sprachen und aktuelle Unterkunft zurück.',
      parameters: {
        type: 'object',
        properties: {
          code: { type: 'string', description: 'Klient*innen-Code oder Teilstring (z.B. "RES-A")' },
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
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_housing_units',
      description:
        'Listet Wohneinheiten mit aktueller Belegung auf. Zeigt freie Betten und offene Wartungsanfragen.',
      parameters: {
        type: 'object',
        properties: {
          hasCapacity: { type: 'boolean', description: 'Nur Einheiten mit freien Plätzen' },
          limit: { type: 'number', description: 'Max. Ergebnisse (Standard: 10)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_recent_incidents',
      description:
        'Gibt aktuelle Vorfälle zurück. Kann nach Kategorie und Lösungsstatus gefiltert werden.',
      parameters: {
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
  },
]

export async function executeStaffChatTool(name: string, rawInput: unknown): Promise<unknown> {
  switch (name) {
    case 'get_dashboard_stats': {
      const [totalResidents, activePlacements, totalUnits, openIncidents, pendingTransfers] =
        await Promise.all([
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
        occupancyRate:
          totalUnits > 0 ? `${Math.round((activePlacements / totalUnits) * 100)}%` : '0%',
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
      return residents.map((r) => ({
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
          maintenanceRequests: {
            where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
            select: { id: true },
          },
        },
        take: Math.min(input.limit ?? 10, MAX_TOOL_LIMIT),
        orderBy: { code: 'asc' },
      })
      const result = units.map((u) => ({
        code: u.code,
        address: u.address,
        totalBeds: u.totalBeds,
        occupied: u.placements.length,
        freeBeds: u.totalBeds - u.placements.length,
        openIncidents: u.incidents.length,
        pendingMaintenance: u.maintenanceRequests.length,
      }))
      return input.hasCapacity ? result.filter((u) => u.freeBeds > 0) : result
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
      return incidents.map((i) => ({
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
