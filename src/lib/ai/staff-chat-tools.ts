import { z } from 'zod'
import { and, asc, desc, eq, inArray, isNull, like, type SQL } from 'drizzle-orm'
import {
  db,
  escapeLike,
  housingUnit,
  incident,
  maintenanceRequest,
  placement,
  resident,
  transferRequest,
} from '@/lib/db'

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
          db.$count(resident),
          db.$count(placement, eq(placement.status, 'ACTIVE')),
          db.$count(housingUnit),
          db.$count(incident, isNull(incident.resolvedAt)),
          db.$count(transferRequest, eq(transferRequest.status, 'PENDING')),
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

      const conditions: SQL[] = []
      if (input.code)
        conditions.push(like(resident.code, `%${escapeLike(input.code.toUpperCase())}%`))
      if (input.status) conditions.push(eq(resident.status, input.status))

      const residents = await db.query.resident.findMany({
        where: and(...conditions),
        columns: {
          code: true,
          status: true,
          languages: true,
        },
        with: {
          placements: {
            where: eq(placement.status, 'ACTIVE'),
            columns: {},
            with: { housingUnit: { columns: { code: true, address: true } } },
            limit: 1,
          },
        },
        limit: Math.min(input.limit ?? 10, MAX_TOOL_LIMIT),
        orderBy: [desc(resident.createdAt)],
      })
      return residents.map((r) => ({
        code: r.code,
        status: r.status,
        languages: r.languages ?? [],
        currentUnit: r.placements[0]?.housingUnit?.code ?? null,
        unitAddress: r.placements[0]?.housingUnit?.address ?? null,
      }))
    }

    case 'get_housing_units': {
      const parsed = housingUnitsInputSchema.safeParse(rawInput)
      if (!parsed.success) return { error: 'Ungültige Eingabe' }
      const input = parsed.data

      const units = await db.query.housingUnit.findMany({
        columns: {
          code: true,
          address: true,
          totalBeds: true,
        },
        with: {
          placements: { where: eq(placement.status, 'ACTIVE'), columns: { id: true } },
          incidents: { where: isNull(incident.resolvedAt), columns: { id: true } },
          maintenanceRequests: {
            where: inArray(maintenanceRequest.status, ['OPEN', 'IN_PROGRESS']),
            columns: { id: true },
          },
        },
        limit: Math.min(input.limit ?? 10, MAX_TOOL_LIMIT),
        orderBy: [asc(housingUnit.code)],
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

      const conditions: SQL[] = []
      if (input.category) conditions.push(eq(incident.category, input.category))
      if (input.unresolved) conditions.push(isNull(incident.resolvedAt))

      const incidents = await db.query.incident.findMany({
        where: and(...conditions),
        columns: {
          type: true,
          category: true,
          severity: true,
          date: true,
          resolvedAt: true,
        },
        with: {
          housingUnit: { columns: { code: true } },
        },
        orderBy: [desc(incident.date)],
        limit: Math.min(input.limit ?? 10, MAX_TOOL_LIMIT),
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
