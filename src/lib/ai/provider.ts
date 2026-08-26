/**
 * Fleet AI provider — SSOT for every AI call in this app.
 *
 * Priority: Groq (free, fleet default) → OpenRouter (fallback, free-tier models).
 * Anthropic is not used; no deployment on the box carries that key.
 *
 * THIS FILE USED TO DESCRIBE A FALLBACK IT DID NOT HAVE. The sentence above has
 * been here all along, but `getAIProviderConfig()` picked ONE provider and
 * returned it, and every caller threw on the first failure. There was no chain,
 * no retry and no second vendor — so a Groq rate limit was terminal, and the
 * documented behaviour existed only in the comment. Both live deployments carry
 * `GROQ_API_KEY` and no `OPENROUTER_API_KEY`, which made the gap invisible:
 * with one key configured, "picks the first configured provider" and "falls
 * back to the second" are the same observable behaviour.
 *
 * The chain now comes from `ai-kit`, which the fleet already uses for
 * exactly this and which the shared inventory names as the answer to sixteen
 * hand-rolled provider clients. It is headless — it supplies the ordering, the
 * free-tier model lists and the 429 taxonomy; we keep the fetch.
 *
 * Falling back to a smaller model at the SAME vendor buys nothing: it draws on
 * the same org-wide daily budget, so on the day that budget runs out every link
 * in such a chain is already dead. Only a different vendor has a different
 * meter, which is why the chain crosses vendors and not model sizes.
 *
 * Surfaces:
 * - `completeText` — @fleet/ai-forms ("Aus Text ausfüllen" on intake)
 * - `runStaffChat` — streaming staff assistant (/api/ai/chat)
 */

import { freeChain, usableChain, chainFrom } from 'ai-kit'
import { BRAND } from '@/lib/config/brand'
import { AIChainExhaustedError, AIProviderError, shouldTryNextProvider } from './errors'

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
 * Resolved endpoint + model for the FIRST provider in the chain.
 *
 * @deprecated use `getAIProviderConfigs` — this returns one link and therefore
 * cannot fall back. Kept because it is exported.
 *
 * It used to build that config by hand, reading `env.GROQ_MODEL` /
 * `env.OPENROUTER_MODEL` directly. That made it a second, divergent answer to
 * "which model do we call" — and the divergence was not theoretical: it read
 * the raw env pin while `getAIProviderConfigs` read the pin through
 * `chainFrom`. Delegating leaves exactly one code path that decides a model.
 *
 * Returns null when neither GROQ_API_KEY nor OPENROUTER_API_KEY is set.
 */
export async function getAIProviderConfig(): Promise<AIProviderConfig | null> {
  const [first] = await getAIProviderConfigs()
  return first ?? null
}

/**
 * Every configured provider, in fallback order.
 *
 * `usableChain` drops vendors whose key is absent, so a deployment with only
 * GROQ_API_KEY gets a one-link chain rather than a second link that would fail
 * on every request with a 401.
 */
export async function getAIProviderConfigs(): Promise<AIProviderConfig[]> {
  const { env } = await import('@/lib/env')

  // `usableChain` drops vendors with no key and expands each survivor into
  // (provider, model) links.
  //
  // The pin is applied PER VENDOR, not once for the whole chain. Passing
  // GROQ_MODEL to `chainFrom` over the combined chain pinned a Groq model id
  // across every link, so a deployment with only OPENROUTER_API_KEY posted
  // `openai/gpt-oss-120b` to OpenRouter — a model id that vendor does not
  // serve. A model name only means something at the vendor that publishes it.
  const links = usableChain(freeChain('AOZ'), process.env)

  // ONE link per vendor. The chain lists several models per provider, but a
  // second model at the SAME vendor draws on the same org-wide daily budget —
  // so on the day it runs out, that "fallback" is already dead. Only a
  // different vendor has a different meter, and trying same-vendor models
  // first just spends the next vendor's latency budget on a certain failure.
  const seen = new Set<string>()
  const configs: AIProviderConfig[] = []

  for (const link of links) {
    const provider = link.provider.id as AIProvider
    if (seen.has(provider)) continue
    seen.add(provider)

    const headers: Record<string, string> = {
      Authorization: `Bearer ${process.env[link.provider.keyEnv] ?? ''}`,
      'Content-Type': 'application/json',
    }
    if (provider === 'openrouter') {
      // OpenRouter attributes free-tier usage by referer/title.
      headers['HTTP-Referer'] = env.NEXT_PUBLIC_APP_URL ?? 'https://aoz.orangecat.ch'
      headers['X-Title'] = BRAND.productName
    }

    // This vendor's own pin, or the chain's first free model for it.
    const pinned = provider === 'groq' ? env.GROQ_MODEL : env.OPENROUTER_MODEL
    const [preferred] = chainFrom(pinned, [link])

    configs.push({
      provider,
      url: `${link.provider.baseUrl}/chat/completions`,
      headers,
      model: preferred?.model ?? link.model,
    })
  }

  return configs
}

/**
 * Run `attempt` down the chain until one provider answers.
 *
 * A `size` 429 stops the walk immediately — the request is too long for any
 * window, so asking the next vendor only wastes its budget too.
 */
export async function withProviderFallback<T>(
  attempt: (config: AIProviderConfig) => Promise<T>
): Promise<T> {
  const configs = await getAIProviderConfigs()
  if (configs.length === 0) throw new AIChainExhaustedError(null)

  let last: AIProviderError | null = null

  for (const config of configs) {
    try {
      return await attempt(config)
    } catch (error) {
      if (!(error instanceof AIProviderError)) throw error
      last = error
      if (!shouldTryNextProvider(error)) break
    }
  }

  throw new AIChainExhaustedError(last)
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
    // The body goes on the error for the LOG. It must never be interpolated
    // into a message that reaches a browser — it carries the vendor's own
    // prose and, on Groq, the organisation id. @see ./errors.ts
    const detail = await res.text().catch(() => '')
    throw new AIProviderError(config.provider, res.status, detail)
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
  return withProviderFallback((config) => completeWithOpenAICompat(config, input))
}
