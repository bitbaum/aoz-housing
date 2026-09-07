/**
 * AI chain health — did the last completion actually work?
 *
 * `withProviderFallback` already knows whether every link in the chain
 * refused; this just remembers that fact between requests so `/api/health`
 * can say so before a caseworker does. Mirrors the same `ai-kit` tracker
 * adopted fleet-wide (evig, kivvi, botsmann, hirnli).
 */

import { createHealthTracker } from '@bitbaum/ai-kit'

/**
 * Exported so the liveness probe can write into the SAME tracker the real AI
 * features write into. Otherwise one probe proves the provider works and
 * /api/health carries on saying it has never seen a call — the probe's
 * knowledge would die with the request that made it.
 *
 * Prefer the record* helpers below in ordinary code; this exists for handing
 * the tracker to something that records on your behalf.
 */
export const aiHealthTracker = createHealthTracker({ downAfter: 3 })

const tracker = aiHealthTracker

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
