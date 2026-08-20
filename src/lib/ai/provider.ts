/**
 * Fleet AI provider — SSOT for every AI call in this app.
 *
 * Priority: Groq (free, fleet default) → OpenRouter (fallback, free-tier models).
 * Anthropic is not used; no deployment on the box carries that key.
 *
 * Surfaces:
 * - `completeText` — @fleet/ai-forms ("Aus Text ausfüllen" on intake)
 * - `runStaffChat` — streaming staff assistant (/api/ai/chat)
 */

import { BRAND } from '@/lib/config/brand'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

export type AIProvider = 'groq' | 'openrouter'

/** @deprecated use AIProvider */
export type CompletionProvider = AIProvider | null

/**
 * Which backend is configured right now. Groq wins when both keys exist —
 * same rule as every other app on the box.
 */
export function getAIProvider(): AIProvider | null {
  if (process.env.GROQ_API_KEY?.trim()) return 'groq'
  if (process.env.OPENROUTER_API_KEY?.trim()) return 'openrouter'
  return null
}

/** @deprecated use getAIProvider */
export function getCompletionProvider(): CompletionProvider {
  return getAIProvider()
}

export function hasAIProvider(): boolean {
  return getAIProvider() !== null
}

/** @deprecated use hasAIProvider */
export function hasCompletionProvider(): boolean {
  return hasAIProvider()
}

export interface CompletionInput {
  system: string
  prompt: string
  maxTokens: number
  temperature: number
}

export interface AIProviderConfig {
  provider: AIProvider
  url: string
  headers: Record<string, string>
  model: string
}

/**
 * Resolved endpoint + model for the active provider.
 * Returns null when neither GROQ_API_KEY nor OPENROUTER_API_KEY is set.
 */
export async function getAIProviderConfig(): Promise<AIProviderConfig | null> {
  const provider = getAIProvider()
  if (!provider) return null

  const { env } = await import('@/lib/env')

  if (provider === 'groq') {
    return {
      provider,
      url: GROQ_API_URL,
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      model: env.GROQ_MODEL,
    }
  }

  return {
    provider,
    url: OPENROUTER_API_URL,
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': env.NEXT_PUBLIC_APP_URL ?? 'https://aoz.orangecat.ch',
      // From the brand SSOT: a literal here survives a rebrand and quietly
      // reports the old product name to OpenRouter forever.
      'X-Title': BRAND.productName,
    },
    model: env.OPENROUTER_MODEL,
  }
}

async function completeWithOpenAICompat(
  config: AIProviderConfig,
  input: CompletionInput
): Promise<string> {
  const res = await fetch(config.url, {
    method: 'POST',
    headers: config.headers,
    body: JSON.stringify({
      model: config.model,
      max_tokens: input.maxTokens,
      temperature: input.temperature,
      messages: [
        { role: 'system', content: input.system },
        { role: 'user', content: input.prompt },
      ],
    }),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`${config.provider} completion failed (${res.status}): ${detail.slice(0, 500)}`)
  }

  const body = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> }
  return body.choices?.[0]?.message?.content ?? ''
}

/**
 * One non-streaming completion, returning plain text.
 *
 * This is the seam @fleet/ai-forms calls: the package never owns keys, models
 * or budgets, so form assistance uses whatever provider the deployment has.
 */
export async function completeText(input: CompletionInput): Promise<string> {
  const config = await getAIProviderConfig()
  if (!config) {
    throw new Error('No AI provider configured (set GROQ_API_KEY or OPENROUTER_API_KEY)')
  }

  return completeWithOpenAICompat(config, input)
}
