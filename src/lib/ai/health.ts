/**
 * AI chain health — did the last completion actually work?
 *
 * `withProviderFallback` already knows whether every link in the chain
 * refused; this just remembers that fact between requests so `/api/health`
 * can say so before a caseworker does. Mirrors the same `ai-kit` tracker
 * adopted fleet-wide (evig, kivvi, botsmann, hirnli).
 */

import { createHealthTracker } from '@bitbaum/ai-kit'

const tracker = createHealthTracker({ downAfter: 3 })

export function recordAIHealthSuccess(): void {
  tracker.recordSuccess()
}

export function recordAIHealthFailure(error: unknown): void {
  tracker.recordFailure(error)
}

export function getAIHealth() {
  return tracker.getHealth()
}

export function resetAIHealth(): void {
  tracker.reset()
}
