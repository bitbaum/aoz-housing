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

function log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
  if (!shouldLog(level)) return

  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
  }

  if (process.env.NODE_ENV === 'production') {
    // JSON output for log aggregation (Vercel, Datadog, etc.)
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
