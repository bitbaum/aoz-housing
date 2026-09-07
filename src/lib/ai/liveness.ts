/**
 * Can the AI provider answer RIGHT NOW?
 *
 * `/api/health` carries `ai` as an informational field, and that field reports
 * what happened the LAST time something called a provider. Straight after a
 * deploy it is `"unknown"`, and unknown is what it stays until real traffic
 * arrives — so the question a deploy needs answered is the one it cannot
 * answer.
 *
 * Everything that reaches a model here is behind staff auth, so checking it
 * meant signing in as a Betreuer and using the form assistant on a real
 * client's record. That is a bad way to check a deploy, and it is why the state
 * was usually simply unknown.
 *
 * ── No client data crosses this route ────────────────────────────────────────
 * The probe asks a fixed, meaningless question about the colour of the sky. The
 * real AI features here summarise and prefill housing records for named people;
 * this deliberately carries nothing about anybody, which is what makes it safe
 * to run unattended on a schedule.
 *
 * ── It probes THIS app's provider layer ──────────────────────────────────────
 * `ask` calls `completeText`, the same function the form assistant and staff
 * chat use — including `withProviderFallback`, this app's own cascade. A probe
 * built on ai-kit's default chain would test providers this deployment may not
 * even be configured for.
 *
 * ── Gating and caching are ai-kit's ──────────────────────────────────────────
 * Only on `?probe=1` WITH the secret, a success cached ten minutes so a monitor
 * cannot drain the shared free budget, a failure never cached, and 501 rather
 * than an open endpoint when no secret is set.
 */

import { createAiHealthHandler } from '@bitbaum/ai-kit'

import { completeText, hasAIProvider } from './provider'
import { aiHealthTracker } from './health'

/**
 * Built lazily. Next evaluates module-level code during the BUILD, where the
 * runtime's keys are absent — an eagerly-built handler would capture that empty
 * environment and report a dead provider forever on a deployment that is fine.
 */
let handler: ((request: Request) => Promise<Response>) | null = null

export function aiLivenessHandler(request: Request): Promise<Response> {
  handler ??= createAiHealthHandler({
    // A getter, not a value: the handler is built once and reused, so a plain
    // string would be whatever the environment held on the first request —
    // un-rotatable without a restart, and untestable.
    secret: () => process.env.AI_PROBE_SECRET,
    // The tracker the real features write to, so one probe also answers the
    // next ordinary /api/health poll instead of dying with this request.
    health: aiHealthTracker,
    ask: async () => {
      if (!hasAIProvider()) {
        // Distinct from "the provider refused": nothing was going to be called,
        // and the fix is configuration rather than the vendor.
        throw new Error('No AI provider is configured for this deployment')
      }

      const text = await completeText({
        system: 'Answer with a single word, no punctuation.',
        prompt: 'What colour is a clear midday sky? Answer in one word.',
        // Generous on purpose: a reasoning model spends this budget thinking
        // before emitting a visible token, and an empty completion is a
        // failure — a mean budget would make a healthy deployment look dead.
        maxTokens: 256,
        temperature: 0,
      })

      return { text, id: 'aoz-ai' }
    },
  })
  return handler(request)
}
