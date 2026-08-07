/**
 * Text completion provider.
 *
 * One seam, two possible backends, chosen by which key is actually present.
 *
 * Why this exists: this app was written against Anthropic, and no machine it
 * deploys to has ever had an ANTHROPIC_API_KEY. Every other app on the same box
 * runs on Groq. So the AI surface typechecked, tested and shipped green while
 * answering 503 to every real request — a feature that existed everywhere
 * except in production.
 *
 * Groq is preferred when both keys exist: it is the fleet's configured provider
 * and it is free, so the default path costs nothing to leave switched on.
 * Anthropic remains supported so a deployment that does set that key keeps
 * working without a code change.
 *
 * The streaming chat assistant (/api/ai/chat) still speaks the Anthropic SDK
 * directly — it is a tool-use loop, not a completion, and porting it is a
 * separate piece of work. Until that happens it stays 503 wherever only a Groq
 * key is set. See getCompletionProvider() for the single answer to "which
 * backend are we on".
 */

import Anthropic from '@anthropic-ai/sdk'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

export type CompletionProvider = 'groq' | 'anthropic' | null

/**
 * Which backend a completion would use right now, or null if none is
 * configured. Callers answer 503 on null rather than failing mid-request.
 */
export function getCompletionProvider(): CompletionProvider {
  if (process.env.GROQ_API_KEY) return 'groq'
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic'
  return null
}

export function hasCompletionProvider(): boolean {
  return getCompletionProvider() !== null
}

export interface CompletionInput {
  system: string
  prompt: string
  maxTokens: number
  temperature: number
}

// Lazy-init so a missing key in dev doesn't crash module-load.
let _anthropic: Anthropic | null = null

function anthropicClient(): Anthropic {
  if (!_anthropic) _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  return _anthropic
}

/**
 * Read a configured model name.
 *
 * '@/lib/env' is imported lazily on purpose: at module scope its production
 * validation runs during `next build` page-data collection, where there is no
 * env to validate.
 */
async function modelFor(provider: Exclude<CompletionProvider, null>): Promise<string> {
  const { env } = await import('@/lib/env')
  return provider === 'groq' ? env.GROQ_MODEL : env.ANTHROPIC_MODEL
}

async function completeWithGroq(input: CompletionInput, model: string): Promise<string> {
  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: input.maxTokens,
      temperature: input.temperature,
      messages: [
        { role: 'system', content: input.system },
        { role: 'user', content: input.prompt },
      ],
    }),
  })

  if (!res.ok) {
    // The body carries the actual reason (bad key, decommissioned model, rate
    // limit). Losing it turns every provider problem into the same blank wall.
    const detail = await res.text().catch(() => '')
    throw new Error(`Groq completion failed (${res.status}): ${detail.slice(0, 500)}`)
  }

  const body = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> }
  return body.choices?.[0]?.message?.content ?? ''
}

async function completeWithAnthropic(input: CompletionInput, model: string): Promise<string> {
  const message = await anthropicClient().messages.create({
    model,
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

/**
 * One non-streaming completion, returning plain text.
 *
 * This is the seam @fleet/ai-forms calls: the package never owns keys, models
 * or budgets, so form assistance uses whatever provider the deployment has.
 */
export async function completeText(input: CompletionInput): Promise<string> {
  const provider = getCompletionProvider()
  if (!provider) throw new Error('No AI provider configured (set GROQ_API_KEY or ANTHROPIC_API_KEY)')

  const model = await modelFor(provider)
  return provider === 'groq'
    ? completeWithGroq(input, model)
    : completeWithAnthropic(input, model)
}
