/**
 * Form Assist API
 *
 * POST /api/ai/form-assist
 *
 * One route for every AI-assisted form in the app. Adding assistance to another
 * form means adding it to AI_FORMS — nothing here changes.
 *
 * The field registry stays server-side: the client names a form, never its
 * fields, so a crafted request cannot widen what the model may write, and
 * fields marked `aiExcluded` are never even shown to it.
 */

import { createFormAssistHandler, type AuthorizeResult } from '@fleet/ai-forms/server'
import { getCurrentUser } from '@/lib/auth'
import { consumeRateLimit } from '@/lib/auth/rate-limit'
import { completeText, hasAnthropicKey } from '@/lib/ai/anthropic'
import { AI_FORMS } from '@/lib/config/ai-forms'
import { AI_FORM_ERRORS } from '@/lib/constants'

async function authorize(): Promise<AuthorizeResult> {
  if (!hasAnthropicKey()) {
    return { ok: false, status: 503, error: AI_FORM_ERRORS.notConfigured }
  }

  const user = await getCurrentUser()
  if (!user) {
    return { ok: false, status: 401, error: AI_FORM_ERRORS.unauthenticated }
  }

  // Every call is metered, so `consume` rather than `check` — a plain check
  // never increments and would be a throttle that can't trip.
  const rateCheck = consumeRateLimit(`ai-form-assist:${user.id}`)
  if (!rateCheck.allowed) {
    return { ok: false, status: 429, error: AI_FORM_ERRORS.rateLimited(rateCheck.retryAfter) }
  }

  return { ok: true }
}

export const POST = createFormAssistHandler({
  targets: AI_FORMS,
  complete: completeText,
  authorize,
})
