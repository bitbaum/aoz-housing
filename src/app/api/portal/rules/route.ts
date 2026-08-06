import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getPortalAuth } from '@/lib/portal-auth'
import { logger } from '@/lib/logger'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'
import { getOutstandingRules, getRuleBook } from '@/lib/governance/queries'
import { acknowledgeAllSchema } from '@/lib/validation/governance'

/** The rule book for this resident's house, plus what they have not yet seen. */
export async function GET() {
  const auth = await getPortalAuth()
  if (!auth) {
    return NextResponse.json({ success: false, error: ERROR_MESSAGES.NOT_AUTHENTICATED }, { status: 401 })
  }

  try {
    const [ruleBook, outstanding] = await Promise.all([
      getRuleBook(auth.placement.housingUnitId),
      getOutstandingRules(auth.resident.id, auth.placement.housingUnitId),
    ])

    return NextResponse.json({
      success: true,
      data: {
        ruleBook,
        outstandingRuleIds: outstanding.map((o) => o.rule.id),
        amendedRuleIds: outstanding.filter((o) => o.isAmendment).map((o) => o.rule.id),
      },
    })
  } catch (error) {
    logger.errorWithCause('Failed to load portal rule book', error, {
      residentId: auth.resident.id,
    })
    return NextResponse.json({ success: false, error: ERROR_MESSAGES.SAVE_ERROR }, { status: 500 })
  }
}

/**
 * Confirm having read one or more rules.
 *
 * Acknowledgement is recorded per rule *version*: it is a record of what this
 * person was actually shown, which is exactly what makes it useful later when a
 * conflict turns on "nobody told me".
 */
export async function POST(request: NextRequest) {
  const auth = await getPortalAuth()
  if (!auth) {
    return NextResponse.json({ success: false, error: ERROR_MESSAGES.NOT_AUTHENTICATED }, { status: 401 })
  }

  try {
    const parsed = acknowledgeAllSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: ERROR_MESSAGES.INVALID_INPUT }, { status: 400 })
    }

    // Only rules that actually bind this resident — an acknowledgement of
    // another house's rule would be meaningless and is silently impossible.
    const bindingRules = await prisma.houseRule.findMany({
      where: {
        id: { in: parsed.data.ruleIds },
        status: 'ACTIVE',
        OR: [{ scope: 'ORG' }, { scope: 'UNIT', housingUnitId: auth.placement.housingUnitId }],
      },
      select: { id: true, version: true },
    })

    await prisma.ruleAcknowledgement.createMany({
      data: bindingRules.map((rule) => ({
        ruleId: rule.id,
        residentId: auth.resident.id,
        ruleVersion: rule.version,
      })),
      skipDuplicates: true,
    })

    return NextResponse.json({ success: true, data: { acknowledged: bindingRules.length } })
  } catch (error) {
    logger.errorWithCause('Failed to acknowledge rules', error, { residentId: auth.resident.id })
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.RULE_ACKNOWLEDGE_ERROR },
      { status: 500 }
    )
  }
}
