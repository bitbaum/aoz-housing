/**
 * Anthropic client — one place that owns the key check, the lazy client and
 * the model choice.
 *
 * Both AI features go through here: the chat assistant (streaming, with tools)
 * and form assistance (one non-streaming completion). Keeping the client here
 * means there is one answer to "is the assistant configured?" and one place to
 * change the model, rather than a second copy drifting in the next route that
 * needs a completion.
 */

import Anthropic from '@anthropic-ai/sdk'

// Lazy-init so a missing ANTHROPIC_API_KEY in dev doesn't crash module-load.
let _client: Anthropic | null = null

export function getAnthropic(): Anthropic {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  return _client
}

/** Whether an API key is present at all. Callers answer 503 when it is not. */
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

/**
 * One non-streaming completion, returning plain text.
 *
 * This is the seam @fleet/ai-forms calls: the package never owns keys, models
 * or budgets, so form assistance uses the same client and model policy as
 * everything else in the app.
 */
export async function completeText(input: {
  system: string
  prompt: string
  maxTokens: number
  temperature: number
}): Promise<string> {
  const message = await getAnthropic().messages.create({
    model: await getAnthropicModel(),
    max_tokens: input.maxTokens,
    temperature: input.temperature,
    system: input.system,
    messages: [{ role: 'user', content: input.prompt }],
  })

  return message.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('')
}
