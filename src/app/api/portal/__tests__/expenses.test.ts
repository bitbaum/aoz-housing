/**
 * Tests for the shared-expenses portal API
 *
 * Endpoints:
 *   POST   /api/portal/expenses       — record an expense (equal split)
 *   DELETE /api/portal/expenses/[id]  — delete (payer or creator only)
 *   POST   /api/portal/settlements    — record a payment between roommates
 */

import { NextRequest } from 'next/server'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'

// --- Mocks ---

const mockGetPortalAuth = jest.fn()
const mockGetActiveUnitMembers = jest.fn()
jest.mock('@/lib/portal-auth', () => ({
  getPortalAuth: () => mockGetPortalAuth(),
  getActiveUnitMembers: (...args: unknown[]) => mockGetActiveUnitMembers(...args),
}))

const mockExpenseCreate = jest.fn()
const mockExpenseFindUnique = jest.fn()
const mockExpenseDelete = jest.fn()
const mockSettlementCreate = jest.fn()
jest.mock('@/lib/db', () => ({
  prisma: {
    expense: {
      create: (...args: unknown[]) => mockExpenseCreate(...args),
      findUnique: (...args: unknown[]) => mockExpenseFindUnique(...args),
      delete: (...args: unknown[]) => mockExpenseDelete(...args),
    },
    settlement: {
      create: (...args: unknown[]) => mockSettlementCreate(...args),
    },
  },
}))

const mockLogAudit = jest.fn().mockResolvedValue(undefined)
jest.mock('@/lib/audit', () => ({
  logAudit: (...args: unknown[]) => mockLogAudit(...args),
}))

jest.mock('@/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    errorWithCause: jest.fn(),
  },
}))

// --- Import after mocks ---

import { POST as createExpense } from '../expenses/route'
import { DELETE as deleteExpense } from '../expenses/[id]/route'
import { POST as createSettlement } from '../settlements/route'

// --- Helpers ---

const AUTH = {
  resident: { id: 'georgy', code: 'RES-GEO001' },
  placement: { id: 'placement-1', housingUnitId: 'unit-1' },
}

const MEMBERS = [
  { id: 'alex', code: 'RES-ALE001', displayName: 'Alex', photoVersion: null },
  { id: 'georgy', code: 'RES-GEO001', displayName: 'Georgy', photoVersion: null },
  { id: 'ihor', code: 'RES-IHO001', displayName: 'Ihor', photoVersion: null },
  { id: 'misha', code: 'RES-MIS001', displayName: 'Misha', photoVersion: null },
]

function jsonRequest(url: string, method: string, body: unknown): NextRequest {
  return new NextRequest(`http://localhost${url}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const VALID_EXPENSE = { description: 'Wocheneinkauf', category: 'GROCERIES', amountRappen: 4000 }

beforeEach(() => {
  jest.clearAllMocks()
  mockGetPortalAuth.mockResolvedValue(AUTH)
  mockGetActiveUnitMembers.mockResolvedValue(MEMBERS)
  mockExpenseCreate.mockImplementation((args: { data: unknown }) =>
    Promise.resolve({ id: 'expense-1', ...(args.data as object), shares: [] })
  )
  mockSettlementCreate.mockImplementation((args: { data: unknown }) =>
    Promise.resolve({ id: 'settlement-1', ...(args.data as object) })
  )
})

describe('POST /api/portal/expenses', () => {
  it('returns 401 without a session', async () => {
    mockGetPortalAuth.mockResolvedValue(null)
    const response = await createExpense(jsonRequest('/api/portal/expenses', 'POST', VALID_EXPENSE))
    expect(response.status).toBe(401)
  })

  it('creates an equal split across all unit members by default', async () => {
    const response = await createExpense(jsonRequest('/api/portal/expenses', 'POST', VALID_EXPENSE))
    expect(response.status).toBe(200)

    const created = mockExpenseCreate.mock.calls[0][0].data
    expect(created.paidById).toBe('georgy')
    expect(created.createdById).toBe('georgy')
    const shares = created.shares.create as { residentId: string; amountRappen: number }[]
    expect(shares).toHaveLength(4)
    expect(shares.reduce((a, s) => a + s.amountRappen, 0)).toBe(4000)
  })

  it('allows recording on behalf of another roommate with chosen participants', async () => {
    const response = await createExpense(
      jsonRequest('/api/portal/expenses', 'POST', {
        ...VALID_EXPENSE,
        paidById: 'ihor',
        participantIds: ['ihor', 'misha'],
      })
    )
    expect(response.status).toBe(200)
    const created = mockExpenseCreate.mock.calls[0][0].data
    expect(created.paidById).toBe('ihor')
    expect(created.createdById).toBe('georgy')
    expect(created.shares.create).toHaveLength(2)
  })

  it('rejects a payer who does not live in the unit', async () => {
    const response = await createExpense(
      jsonRequest('/api/portal/expenses', 'POST', { ...VALID_EXPENSE, paidById: 'stranger' })
    )
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBe(ERROR_MESSAGES.EXPENSE_MEMBER_INVALID)
    expect(mockExpenseCreate).not.toHaveBeenCalled()
  })

  it('rejects participants who do not live in the unit', async () => {
    const response = await createExpense(
      jsonRequest('/api/portal/expenses', 'POST', {
        ...VALID_EXPENSE,
        participantIds: ['georgy', 'stranger'],
      })
    )
    expect(response.status).toBe(400)
    expect(mockExpenseCreate).not.toHaveBeenCalled()
  })

  it.each([
    ['unknown category', { ...VALID_EXPENSE, category: 'CRYPTO' }],
    ['zero amount', { ...VALID_EXPENSE, amountRappen: 0 }],
    ['negative amount', { ...VALID_EXPENSE, amountRappen: -100 }],
    ['fractional amount', { ...VALID_EXPENSE, amountRappen: 12.5 }],
    ['empty description', { ...VALID_EXPENSE, description: '   ' }],
  ])('rejects %s with 400', async (_label, body) => {
    const response = await createExpense(jsonRequest('/api/portal/expenses', 'POST', body))
    expect(response.status).toBe(400)
    expect(mockExpenseCreate).not.toHaveBeenCalled()
  })
})

describe('DELETE /api/portal/expenses/[id]', () => {
  const EXPENSE = {
    id: 'expense-1',
    housingUnitId: 'unit-1',
    paidById: 'ihor',
    createdById: 'georgy',
    amountRappen: 4000,
  }

  function del(id = 'expense-1') {
    return deleteExpense(new NextRequest(`http://localhost/api/portal/expenses/${id}`, { method: 'DELETE' }), {
      params: { id },
    })
  }

  it('lets the creator delete', async () => {
    mockExpenseFindUnique.mockResolvedValue(EXPENSE)
    const response = await del()
    expect(response.status).toBe(200)
    expect(mockExpenseDelete).toHaveBeenCalledWith({ where: { id: 'expense-1' } })
  })

  it('lets the payer delete', async () => {
    mockExpenseFindUnique.mockResolvedValue({ ...EXPENSE, paidById: 'georgy', createdById: 'ihor' })
    const response = await del()
    expect(response.status).toBe(200)
  })

  it('refuses an uninvolved roommate with 403', async () => {
    mockExpenseFindUnique.mockResolvedValue({ ...EXPENSE, paidById: 'misha', createdById: 'alex' })
    const response = await del()
    expect(response.status).toBe(403)
    expect(mockExpenseDelete).not.toHaveBeenCalled()
  })

  it("hides another unit's expense as 404", async () => {
    mockExpenseFindUnique.mockResolvedValue({ ...EXPENSE, housingUnitId: 'unit-2' })
    const response = await del()
    expect(response.status).toBe(404)
    expect(mockExpenseDelete).not.toHaveBeenCalled()
  })
})

describe('POST /api/portal/settlements', () => {
  it('records a payment to a roommate', async () => {
    const response = await createSettlement(
      jsonRequest('/api/portal/settlements', 'POST', { toResidentId: 'ihor', amountRappen: 1500 })
    )
    expect(response.status).toBe(200)
    const created = mockSettlementCreate.mock.calls[0][0].data
    expect(created).toMatchObject({ fromId: 'georgy', toId: 'ihor', amountRappen: 1500 })
  })

  it('refuses paying yourself', async () => {
    const response = await createSettlement(
      jsonRequest('/api/portal/settlements', 'POST', { toResidentId: 'georgy', amountRappen: 1500 })
    )
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBe(ERROR_MESSAGES.SETTLEMENT_SELF)
  })

  it('refuses a receiver outside the unit', async () => {
    const response = await createSettlement(
      jsonRequest('/api/portal/settlements', 'POST', { toResidentId: 'stranger', amountRappen: 1500 })
    )
    expect(response.status).toBe(400)
    expect(mockSettlementCreate).not.toHaveBeenCalled()
  })
})
