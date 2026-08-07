/**
 * Anthropic client — for the streaming chat assistant only.
 *
 * The chat route is a tool-use loop written against the Anthropic SDK, so it
 * keeps its own client and its own "is it configured?" answer. Anything that
 * needs a plain completion — form assistance, and anything added next — goes
 * through src/lib/ai/provider.ts instead, which runs on whichever provider the
 * deployment actually has a key for.
 */

import Anthropic from '@anthropic-ai/sdk'

// Lazy-init so a missing ANTHROPIC_API_KEY in dev doesn't crash module-load.
let _client: Anthropic | null = null

export function getAnthropic(): Anthropic {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  return _client
}

/** Whether an Anthropic key is present. The chat route answers 503 when not. */
export function hasAnthropicKey(): boolean {
  return !!process.env.ANTHROPIC_API_KEY
}

/**
 * Read the configured model.
 *
 * Imported lazily on purpose: a module-scope import of '@/lib/env' runs its
 * production env validation during `next build` page-data collection, where
 * there is no env.
 */
export async function getAnthropicModel(): Promise<string> {
  const { env } = await import('@/lib/env')
  return env.ANTHROPIC_MODEL
}
