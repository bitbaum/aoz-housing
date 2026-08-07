/**
 * Structured logging utility
 *
 * Provides consistent log formatting with context, timestamps, and log levels.
 * Outputs JSON in production for log aggregation, human-readable in development.
 *
 * Usage:
 *   import { logger } from '@/lib/logger'
 *   logger.error('Failed to create placement', { residentId, error })
 *   logger.info('Placement created', { placementId })
 */
import { ALL_CODE_PREFIXES } from '@/lib/config/brand'
import { RESIDENT_CODE_PREFIX } from '@/lib/auth/code-prefixes'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: Record<string, unknown>
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

const MIN_LEVEL = process.env.NODE_ENV === 'production' ? 'info' : 'debug'

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[MIN_LEVEL]
}

function formatError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      errorName: error.name,
      errorMessage: error.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
    }
  }
  return { errorMessage: String(error) }
}

// Patterns that identify PII we never want in logs / log aggregators.
// Mirrors the Sentry beforeSend redactor so both pipelines redact uniformly.
//
// Staff-code patterns are derived from EVERY brand's prefix, not the active
// one. Codes outlive the brand that issued them, and a redactor written
// against a single literal prefix silently stops redacting the day the product
// is re-badged — leaking exactly the credentials it exists to hide. Longest
// prefix first so 'AOZH-' is never partially matched by 'AOZ-'.
const STAFF_CODE_REDACTORS: ReadonlyArray<[RegExp, string]> = [...ALL_CODE_PREFIXES]
  .sort((a, b) => b.length - a.length)
  .map((prefix) => [
    new RegExp(`${prefix.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&')}[A-Z0-9]+`, 'g'),
    `${prefix}[REDACTED]`,
  ])

const PII_REDACTORS: ReadonlyArray<[RegExp, string]> = [
  [/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]'],
  [
    new RegExp(`${RESIDENT_CODE_PREFIX}[A-Z0-9]+`, 'g'),
    `${RESIDENT_CODE_PREFIX}[REDACTED]`,
  ],
  ...STAFF_CODE_REDACTORS,
]

function redactString(value: string): string {
  let out = value
  for (const [pattern, replacement] of PII_REDACTORS) {
    out = out.replace(pattern, replacement)
  }
  return out
}

function redactValue(value: unknown): unknown {
  if (typeof value === 'string') return redactString(value)
  if (Array.isArray(value)) return value.map(redactValue)
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = redactValue(v)
    }
    return out
  }
  return value
}

function redactContext(ctx: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!ctx) return ctx
  return redactValue(ctx) as Record<string, unknown>
}

function log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
  if (!shouldLog(level)) return

  const entry: LogEntry = {
    level,
    message: redactString(message),
    timestamp: new Date().toISOString(),
    context: redactContext(context),
  }

  if (process.env.NODE_ENV === 'production') {
    // JSON output for log aggregation (journald, Datadog, etc.)
    const output = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log
    output(JSON.stringify(entry))
  } else {
    // Human-readable in development
    const prefix = `[${level.toUpperCase()}]`
    const output = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log
    if (context) {
      output(prefix, message, context)
    } else {
      output(prefix, message)
    }
  }
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => log('debug', message, context),
  info: (message: string, context?: Record<string, unknown>) => log('info', message, context),
  warn: (message: string, context?: Record<string, unknown>) => log('warn', message, context),
  error: (message: string, context?: Record<string, unknown>) => log('error', message, context),

  /** Log an error with automatic error object extraction */
  errorWithCause: (message: string, error: unknown, context?: Record<string, unknown>) =>
    log('error', message, { ...formatError(error), ...context }),
}
