import { aiLivenessHandler } from '@/lib/ai/liveness'

export const dynamic = 'force-dynamic'

/**
 * Can the AI provider answer RIGHT NOW?
 *
 *   GET /api/health/ai            free. What the last real call did.
 *   GET /api/health/ai?probe=1    a real call. 200 or 503. Needs AI_PROBE_SECRET,
 *                                 via the `x-probe-secret` header or `?secret=`.
 *
 * Separate from /api/health on purpose: there, `ai` is informational and must
 * never fail the check, because a dead provider key is not fixed by a restart.
 * Here it is the whole point — 200 only when a model actually answered — so an
 * uptime monitor can page on a real AI outage without paging on every deploy.
 *
 * NO CLIENT DATA CROSSES THIS ROUTE. It asks a fixed, meaningless question
 * about the colour of the sky. The real AI features summarise and prefill
 * housing records for named people; this carries nothing about anybody, which
 * is what makes it safe to run unattended.
 */
export const GET = aiLivenessHandler
