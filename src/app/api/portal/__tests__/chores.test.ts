/**
 * Tests for portal chores API routes
 *
 * Endpoints:
 *   GET  /api/portal/chores              — list tasks + contribution balance
 *   POST /api/portal/chores              — create task
 *   GET  /api/portal/chores/[id]         — task detail
 *   POST /api/portal/chores/[id]/complete   — mark complete
 *   POST /api/portal/chores/[id]/complaint  — escalate to incident
 *   POST /api/portal/chores/[id]/attention  — flag for attention
 *   POST /api/portal/chores/[id]/request    — request roommate action
 */

import { NextRequest } from 'next/server'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'

// --- Mocks ---

const mockGetPortalAuth = vi.fn()
vi.mock('@/lib/portal-auth', async () => ({
  getPortalAuth: () => mockGetPortalAuth(),
}))

const mockFindMany = vi.fn()
const mockFindFirst = vi.fn()
const mockCreate = vi.fn()
const mockUpdate = vi.fn()
// Balance loader uses db.select().from(taskCompletion/placement) with joins.
const mockCompletionSelect = vi.fn().mockResolvedValue([])
const mockMemberSelect = vi.fn().mockResolvedValue([])
const mockIncidentCreate = vi.fn()
const mockFlagCreate = vi.fn()
const mockRequestCreate = vi.fn()
const mockTransaction = vi.fn()

vi.mock('@/lib/db', async () => {
  const actual = await vi.importActual<typeof import('@/lib/db')>('@/lib/db')
  // db.select().from(x).innerJoin(...).where(...)[.orderBy(...)] — a chainable
  // builder that is awaited at the end of the chain (thenable).
  const selectChain = (table: unknown) => {
    const resolve = (): Promise<unknown> =>
      table === actual.taskCompletion ? mockCompletionSelect() : mockMemberSelect()
    const chain = {
      innerJoin: () => chain,
      where: () => chain,
      orderBy: () => chain,
      then: (onFulfilled?: (v: unknown) => unknown, onRejected?: (e: unknown) => unknown) =>
        resolve().then(onFulfilled, onRejected),
    }
    return chain
  }
  return {
    ...actual,
    db: {
      query: {
        householdTask: {
          findMany: (...args: unknown[]) => mockFindMany(...args),
          findFirst: (...args: unknown[]) => mockFindFirst(...args),
        },
        placement: {
          findMany: (...args: unknown[]) => mockFindMany(...args),
          findFirst: (...args: unknown[]) => mockFindFirst(...args),
        },
      },
      insert: (table: unknown) => ({
        values: (v: unknown) => ({
          returning: (): Promise<unknown[]> =>
            table === actual.householdTask
              ? mockCreate(v)
              : table === actual.incident
                ? mockIncidentCreate(v)
                : table === actual.taskAttentionFlag
                  ? mockFlagCreate(v)
                  : mockRequestCreate(v),
        }),
      }),
      update: (_table: unknown) => ({
        set: (v: unknown) => ({
          where: (w: unknown): Promise<unknown> => mockUpdate({ set: v, where: w }),
        }),
      }),
      select: () => ({ from: selectChain }),
      transaction: (...args: unknown[]) => mockTransaction(...args),
    },
  }
})

const mockLogAudit = vi.fn().mockResolvedValue(undefined)
vi.mock('@/lib/audit', async () => ({
  logAudit: (...args: unknown[]) => mockLogAudit(...args),
}))

vi.mock('@/lib/logger', async () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    errorWithCause: vi.fn(),
  },
}))

const mockValidateFormData = vi.fn()
const MockValidationError = vi.hoisted(
  () =>
    class ValidationError extends Error {
      fieldErrors: Record<string, string[] | undefined>
      constructor(message: string, fieldErrors: Record<string, string[] | undefined> = {}) {
        super(message)
        this.fieldErrors = fieldErrors
      }
    },
)
// Use the REAL schemas and stub only the form-data helper. A hand-copied
// schema here would go on passing while the route silently dropped every field
// the real schema later gained — which is exactly how two portal fields were
// lost once already. The mock must never become a second definition.
vi.mock('@/lib/validation/schemas', async () => ({
  ...(await vi.importActual('@/lib/validation/schemas')),
  validateFormData: (...args: unknown[]) => mockValidateFormData(...args),
  ValidationError: MockValidationError,
}))

// Deliberately NOT mocked: the complaint→incident mapping these tests assert
// is the config's job, and a copy of it here was byte-identical to the real
// one — a second definition that could only ever drift, never help.

// --- Import after mocks ---

import { GET as listChores, POST as createChore } from '../chores/route'
import { GET as getChoreDetail } from '../chores/[id]/route'
import { POST as completeChore } from '../chores/[id]/complete/route'
import { POST as complainChore } from '../chores/[id]/complaint/route'
import { POST as attentionChore } from '../chores/[id]/attention/route'
import { POST as requestChore } from '../chores/[id]/request/route'
import { householdTask, taskAttentionFlag, taskRequest, placement } from '@/lib/db'
import { eq, and, ne, inArray } from 'drizzle-orm'

// --- Helpers ---

const AUTH_RESULT = {
  resident: { id: 'res-1', code: 'RES-001' },
  placement: { id: 'pl-1', housingUnitId: 'hu-1' },
}

function createJsonRequest(url: string, body?: Record<string, unknown>): NextRequest {
  if (body) {
    return new NextRequest(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
  }
  return new NextRequest(url, { method: 'POST' })
}

function createFormDataRequest(url: string, data: Record<string, string>): NextRequest {
  const formData = new FormData()
  for (const [key, value] of Object.entries(data)) {
    formData.append(key, value)
  }
  return new NextRequest(url, { method: 'POST', body: formData })
}

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

/**
 * A drizzle-shaped transaction stub for the complete route: the tx inserts one
 * TaskCompletion (with .returning()) and issues three .update().set().where()
 * calls, dispatched per table so each can be asserted independently. Update
 * mocks receive `{ set, where }`.
 */
function makeTx(completionResult: { id: string }) {
  const completionCreate = vi.fn().mockResolvedValue([completionResult])
  const taskUpdate = vi.fn().mockResolvedValue(undefined)
  const flagUpdateMany = vi.fn().mockResolvedValue(undefined)
  const requestUpdateMany = vi.fn().mockResolvedValue(undefined)
  const tx = {
    insert: () => ({
      values: (v: unknown) => ({ returning: (): Promise<unknown[]> => completionCreate(v) }),
    }),
    update: (table: unknown) => ({
      set: (v: unknown) => ({
        where: (w: unknown): Promise<unknown> =>
          table === householdTask
            ? taskUpdate({ set: v, where: w })
            : table === taskAttentionFlag
              ? flagUpdateMany({ set: v, where: w })
              : requestUpdateMany({ set: v, where: w }),
      }),
    }),
  }
  return { tx, completionCreate, taskUpdate, flagUpdateMany, requestUpdateMany }
}

const SAMPLE_TASK = {
  id: 'task-1',
  housingUnitId: 'hu-1',
  title: 'Küche putzen',
  category: 'CLEANING',
  taskType: 'RECURRING',
  priority: 'NORMAL',
  currentStatus: 'IDLE',
  isCompleted: false,
  checklist: ['Boden gewischt', 'Abfalleimer geleert'],
}

// --- Tests ---

// =============================================================================
// GET /api/portal/chores
// =============================================================================

describe('GET /api/portal/chores', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('returns 401 when not authenticated', async () => {
    mockGetPortalAuth.mockResolvedValue(null)

    const res = await listChores()
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.success).toBe(false)
    expect(body.error).toBe(ERROR_MESSAGES.NOT_AUTHENTICATED)
  })

  test('returns tasks and a minutes balance on success', async () => {
    mockGetPortalAuth.mockResolvedValue(AUTH_RESULT)

    const tasks = [{ id: 'task-1', title: 'Küche putzen' }]
    const members = [
      { id: 'res-1', code: 'RES-001', displayName: null },
      { id: 'res-2', code: 'RES-002', displayName: null },
    ]

    // Four quick bin runs vs one long shower scrub: counting rows would call
    // res-1 the bigger contributor 4:1. The balance must say the opposite.
    mockCompletionSelect.mockResolvedValue([
      {
        completedById: 'res-1',
        completedAt: new Date(),
        durationMinutes: 5,
        taskEstimatedMinutes: null,
      },
      {
        completedById: 'res-1',
        completedAt: new Date(),
        durationMinutes: 5,
        taskEstimatedMinutes: null,
      },
      {
        completedById: 'res-1',
        completedAt: new Date(),
        durationMinutes: 5,
        taskEstimatedMinutes: null,
      },
      {
        completedById: 'res-1',
        completedAt: new Date(),
        durationMinutes: 5,
        taskEstimatedMinutes: null,
      },
      {
        completedById: 'res-2',
        completedAt: new Date(),
        durationMinutes: 40,
        taskEstimatedMinutes: null,
      },
    ])
    mockMemberSelect.mockResolvedValue(members)
    mockFindMany.mockResolvedValueOnce(tasks) // householdTask.findMany

    const res = await listChores()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.tasks).toEqual(tasks)
    expect(body.data.balances).toEqual([
      {
        residentId: 'res-1',
        code: 'RES-001',
        displayName: null,
        doneMinutes: 20,
        shareMinutes: 30,
        balanceMinutes: -10,
      },
      {
        residentId: 'res-2',
        code: 'RES-002',
        displayName: null,
        doneMinutes: 40,
        shareMinutes: 30,
        balanceMinutes: 10,
      },
    ])
  })

  test('balance shows a zero line for residents who did nothing yet', async () => {
    mockGetPortalAuth.mockResolvedValue(AUTH_RESULT)

    mockCompletionSelect.mockResolvedValue([])
    mockMemberSelect.mockResolvedValue([{ id: 'res-3', code: 'RES-003', displayName: null }])
    mockFindMany.mockResolvedValueOnce([]) // no tasks

    const res = await listChores()
    const body = await res.json()

    expect(body.data.balances).toEqual([
      {
        residentId: 'res-3',
        code: 'RES-003',
        displayName: null,
        doneMinutes: 0,
        shareMinutes: 0,
        balanceMinutes: 0,
      },
    ])
  })

  test('ignores completions from outside the current month', async () => {
    mockGetPortalAuth.mockResolvedValue(AUTH_RESULT)

    // Comfortably inside the 62-day query window but a different calendar
    // month, so only the JS month filter can exclude it.
    const lastMonth = new Date()
    lastMonth.setUTCDate(1)
    lastMonth.setUTCHours(12, 0, 0, 0)
    lastMonth.setUTCDate(lastMonth.getUTCDate() - 5)

    mockCompletionSelect.mockResolvedValue([
      {
        completedById: 'res-1',
        completedAt: lastMonth,
        durationMinutes: 90,
        taskEstimatedMinutes: null,
      },
    ])
    mockMemberSelect.mockResolvedValue([{ id: 'res-1', code: 'RES-001', displayName: null }])
    mockFindMany.mockResolvedValueOnce([])

    const res = await listChores()
    const body = await res.json()

    expect(body.data.balances[0].doneMinutes).toBe(0)
  })

  test('returns 500 when database query fails', async () => {
    mockGetPortalAuth.mockResolvedValue(AUTH_RESULT)
    mockFindMany.mockRejectedValue(new Error('DB error'))

    const res = await listChores()
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.success).toBe(false)
    expect(body.error).toBe(ERROR_MESSAGES.TASKS_LOAD_ERROR)
  })

  test('scopes tasks to authenticated resident housing unit', async () => {
    mockGetPortalAuth.mockResolvedValue(AUTH_RESULT)
    mockFindMany.mockResolvedValueOnce([])
    mockCompletionSelect.mockResolvedValue([])
    mockMemberSelect.mockResolvedValue([])

    await listChores()

    // First findMany call is for householdTask, check the where clause
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: eq(householdTask.housingUnitId, 'hu-1'),
      }),
    )
  })
})

// =============================================================================
// POST /api/portal/chores
// =============================================================================

describe('POST /api/portal/chores', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('returns 401 when not authenticated', async () => {
    mockGetPortalAuth.mockResolvedValue(null)

    const req = createFormDataRequest('http://localhost:3001/api/portal/chores', {
      title: 'Test',
    })
    const res = await createChore(req)
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.success).toBe(false)
    expect(body.error).toBe(ERROR_MESSAGES.NOT_AUTHENTICATED)
  })

  test('returns 400 when validation fails with ValidationError', async () => {
    mockGetPortalAuth.mockResolvedValue(AUTH_RESULT)
    mockValidateFormData.mockImplementation(() => {
      throw new MockValidationError('Titel ist erforderlich')
    })

    const req = createFormDataRequest('http://localhost:3001/api/portal/chores', {
      title: '',
    })
    const res = await createChore(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
    expect(body.error).toBe('Titel ist erforderlich')
  })

  test('returns 400 with generic message for non-validation errors during parsing', async () => {
    mockGetPortalAuth.mockResolvedValue(AUTH_RESULT)
    mockValidateFormData.mockImplementation(() => {
      throw new Error('Unexpected error')
    })

    const req = createFormDataRequest('http://localhost:3001/api/portal/chores', {
      title: 'Test',
    })
    const res = await createChore(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
    expect(body.error).toBe(ERROR_MESSAGES.INVALID_INPUT)
  })

  test('creates task with correct data on success', async () => {
    mockGetPortalAuth.mockResolvedValue(AUTH_RESULT)
    mockValidateFormData.mockReturnValue({
      title: 'Küche putzen',
      description: 'Boden wischen',
      instructions: 'Mit warmem Wasser',
      taskType: 'RECURRING',
      category: 'CLEANING',
      priority: 'HIGH',
      scheduleHuman: 'Jeden Montag',
      estimatedMinutes: 30,
      checklist: ['Boden gewischt', 'Abfalleimer geleert'],
    })
    mockCreate.mockResolvedValue([{ id: 'task-new' }])

    const req = createFormDataRequest('http://localhost:3001/api/portal/chores', {
      title: 'Küche putzen',
    })
    const res = await createChore(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data).toEqual({ id: 'task-new' })

    expect(mockCreate).toHaveBeenCalledWith({
      housingUnitId: 'hu-1',
      createdByResidentId: 'res-1',
      title: 'Küche putzen',
      description: 'Boden wischen',
      instructions: 'Mit warmem Wasser',
      taskType: 'RECURRING',
      category: 'CLEANING',
      priority: 'HIGH',
      scheduleHuman: 'Jeden Montag',
      estimatedMinutes: 30,
      checklist: ['Boden gewischt', 'Abfalleimer geleert'],
    })
  })

  test('sets optional fields to null when not provided', async () => {
    mockGetPortalAuth.mockResolvedValue(AUTH_RESULT)
    mockValidateFormData.mockReturnValue({
      title: 'Müll rausbringen',
      taskType: 'ONE_TIME',
      category: 'TRASH',
      priority: 'NORMAL',
    })
    mockCreate.mockResolvedValue([{ id: 'task-2' }])

    const req = createFormDataRequest('http://localhost:3001/api/portal/chores', {
      title: 'Müll rausbringen',
    })
    await createChore(req)

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        description: null,
        instructions: null,
        scheduleHuman: null,
        estimatedMinutes: null,
      }),
    )
  })

  test('calls logAudit after successful creation', async () => {
    mockGetPortalAuth.mockResolvedValue(AUTH_RESULT)
    mockValidateFormData.mockReturnValue({
      title: 'Putzen',
      taskType: 'RECURRING',
      category: 'CLEANING',
      priority: 'NORMAL',
    })
    mockCreate.mockResolvedValue([{ id: 'task-audit' }])

    const req = createFormDataRequest('http://localhost:3001/api/portal/chores', {
      title: 'Putzen',
    })
    await createChore(req)

    expect(mockLogAudit).toHaveBeenCalledWith({
      action: 'CREATE',
      entity: 'HOUSEHOLD_TASK',
      entityId: 'task-audit',
      changes: {
        title: 'Putzen',
        category: 'CLEANING',
        createdBy: 'RES-001',
      },
    })
  })

  test('returns 500 when database create fails', async () => {
    mockGetPortalAuth.mockResolvedValue(AUTH_RESULT)
    mockValidateFormData.mockReturnValue({
      title: 'Fail',
      taskType: 'ONE_TIME',
      category: 'OTHER',
      priority: 'NORMAL',
    })
    mockCreate.mockRejectedValue(new Error('DB write failed'))

    const req = createFormDataRequest('http://localhost:3001/api/portal/chores', {
      title: 'Fail',
    })
    const res = await createChore(req)
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.success).toBe(false)
    expect(body.error).toBe(ERROR_MESSAGES.TASK_CREATE_ERROR)
    expect(mockLogAudit).not.toHaveBeenCalled()
  })
})

// =============================================================================
// GET /api/portal/chores/[id]
// =============================================================================

describe('GET /api/portal/chores/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('returns 401 when not authenticated', async () => {
    mockGetPortalAuth.mockResolvedValue(null)

    const req = new NextRequest('http://localhost:3001/api/portal/chores/task-1')
    const res = await getChoreDetail(req, makeParams('task-1'))
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.success).toBe(false)
    expect(body.error).toBe(ERROR_MESSAGES.NOT_AUTHENTICATED)
  })

  test('returns 404 when task not found', async () => {
    mockGetPortalAuth.mockResolvedValue(AUTH_RESULT)
    mockFindFirst.mockResolvedValue(null)

    const req = new NextRequest('http://localhost:3001/api/portal/chores/nonexistent')
    const res = await getChoreDetail(req, makeParams('nonexistent'))
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.success).toBe(false)
    expect(body.error).toBe(ERROR_MESSAGES.TASK_NOT_FOUND)
  })

  test('scopes query to housing unit (prevents cross-unit access)', async () => {
    mockGetPortalAuth.mockResolvedValue(AUTH_RESULT)
    mockFindFirst.mockResolvedValue(null)

    const req = new NextRequest('http://localhost:3001/api/portal/chores/task-other')
    await getChoreDetail(req, makeParams('task-other'))

    expect(mockFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: and(eq(householdTask.id, 'task-other'), eq(householdTask.housingUnitId, 'hu-1')),
      }),
    )
  })

  test('returns task detail with roommates and current resident id', async () => {
    mockGetPortalAuth.mockResolvedValue(AUTH_RESULT)

    const taskDetail = {
      id: 'task-1',
      title: 'Küche putzen',
      completions: [],
      attentionFlags: [],
      requests: [],
    }
    mockFindFirst.mockResolvedValue(taskDetail)

    const roommates = [{ resident: { id: 'res-2', code: 'RES-002' } }]
    mockFindMany.mockResolvedValue(roommates)

    const req = new NextRequest('http://localhost:3001/api/portal/chores/task-1')
    const res = await getChoreDetail(req, makeParams('task-1'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.task).toEqual(taskDetail)
    expect(body.data.roommates).toEqual([{ id: 'res-2', code: 'RES-002' }])
    expect(body.data.currentResidentId).toBe('res-1')
  })

  test('excludes current resident from roommates list', async () => {
    mockGetPortalAuth.mockResolvedValue(AUTH_RESULT)
    mockFindFirst.mockResolvedValue({ id: 'task-1' })
    mockFindMany.mockResolvedValue([])

    const req = new NextRequest('http://localhost:3001/api/portal/chores/task-1')
    await getChoreDetail(req, makeParams('task-1'))

    // Verify placement.findMany excludes the current resident
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: and(
          eq(placement.housingUnitId, 'hu-1'),
          eq(placement.status, 'ACTIVE'),
          ne(placement.residentId, 'res-1'),
        ),
      }),
    )
  })

  test('returns 500 when database query fails', async () => {
    mockGetPortalAuth.mockResolvedValue(AUTH_RESULT)
    mockFindFirst.mockRejectedValue(new Error('DB error'))

    const req = new NextRequest('http://localhost:3001/api/portal/chores/task-1')
    const res = await getChoreDetail(req, makeParams('task-1'))
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.success).toBe(false)
    expect(body.error).toBe(ERROR_MESSAGES.TASK_LOAD_ERROR)
  })
})

// =============================================================================
// POST /api/portal/chores/[id]/complete
// =============================================================================

describe('POST /api/portal/chores/[id]/complete', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('returns 401 when not authenticated', async () => {
    mockGetPortalAuth.mockResolvedValue(null)

    const req = createJsonRequest('http://localhost:3001/api/portal/chores/task-1/complete')
    const res = await completeChore(req, makeParams('task-1'))
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.success).toBe(false)
    expect(body.error).toBe(ERROR_MESSAGES.NOT_AUTHENTICATED)
  })

  test('returns 404 when task not found', async () => {
    mockGetPortalAuth.mockResolvedValue(AUTH_RESULT)
    mockFindFirst.mockResolvedValue(null)

    const req = createJsonRequest('http://localhost:3001/api/portal/chores/task-1/complete')
    const res = await completeChore(req, makeParams('task-1'))
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.success).toBe(false)
    expect(body.error).toBe(ERROR_MESSAGES.TASK_NOT_FOUND)
  })

  test('returns 400 when task is already completed', async () => {
    mockGetPortalAuth.mockResolvedValue(AUTH_RESULT)
    mockFindFirst.mockResolvedValue({ ...SAMPLE_TASK, isCompleted: true })

    const req = createJsonRequest('http://localhost:3001/api/portal/chores/task-1/complete')
    const res = await completeChore(req, makeParams('task-1'))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
    expect(body.error).toBe(ERROR_MESSAGES.TASK_ALREADY_COMPLETED)
  })

  test('completes recurring task without marking as fully completed', async () => {
    mockGetPortalAuth.mockResolvedValue(AUTH_RESULT)
    mockFindFirst.mockResolvedValue({ ...SAMPLE_TASK, taskType: 'RECURRING' })

    const completionResult = { id: 'comp-1' }
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) =>
      fn(makeTx(completionResult).tx),
    )

    const req = createJsonRequest('http://localhost:3001/api/portal/chores/task-1/complete')
    const res = await completeChore(req, makeParams('task-1'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)

    // Verify the transaction callback updates the task
    const txFn = mockTransaction.mock.calls[0][0]
    const replay = makeTx(completionResult)
    await txFn(replay.tx)

    // For RECURRING tasks, should NOT set isCompleted/completedAt
    expect(replay.taskUpdate).toHaveBeenCalledWith({
      set: { currentStatus: 'IDLE' },
      where: eq(householdTask.id, 'task-1'),
    })
  })

  test('records only ticked items that are actually on the task checklist', async () => {
    mockGetPortalAuth.mockResolvedValue(AUTH_RESULT)
    mockFindFirst.mockResolvedValue({ ...SAMPLE_TASK })
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) =>
      fn(makeTx({ id: 'comp-1' }).tx),
    )

    const req = createJsonRequest('http://localhost:3001/api/portal/chores/task-1/complete', {
      // The middle item was never agreed by the house — a client must not be
      // able to invent a done-criterion after the fact.
      completedItems: ['Boden gewischt', 'Fenster geputzt'],
    })
    await completeChore(req, makeParams('task-1'))

    const replay = makeTx({ id: 'comp-1' })
    await mockTransaction.mock.calls[0][0](replay.tx)

    expect(replay.completionCreate).toHaveBeenCalledWith(
      expect.objectContaining({ completedItems: ['Boden gewischt'] }),
    )
  })

  test('records a partial completion as partial rather than fully done', async () => {
    mockGetPortalAuth.mockResolvedValue(AUTH_RESULT)
    mockFindFirst.mockResolvedValue({ ...SAMPLE_TASK })
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) =>
      fn(makeTx({ id: 'comp-1' }).tx),
    )

    const req = createJsonRequest('http://localhost:3001/api/portal/chores/task-1/complete', {
      completedItems: ['Abfalleimer geleert'],
    })
    const res = await completeChore(req, makeParams('task-1'))
    expect(res.status).toBe(200)

    const replay = makeTx({ id: 'comp-1' })
    await mockTransaction.mock.calls[0][0](replay.tx)

    expect(replay.completionCreate).toHaveBeenCalledWith(
      expect.objectContaining({ completedItems: ['Abfalleimer geleert'] }),
    )
  })

  test('completes ONE_TIME task and marks as fully completed', async () => {
    mockGetPortalAuth.mockResolvedValue(AUTH_RESULT)
    mockFindFirst.mockResolvedValue({ ...SAMPLE_TASK, taskType: 'ONE_TIME' })

    const completionResult = { id: 'comp-2' }
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) =>
      fn(makeTx(completionResult).tx),
    )

    const req = createJsonRequest('http://localhost:3001/api/portal/chores/task-1/complete')
    const res = await completeChore(req, makeParams('task-1'))

    expect(res.status).toBe(200)

    // Verify ONE_TIME sets isCompleted + completedAt
    const txFn = mockTransaction.mock.calls[0][0]
    const replay = makeTx(completionResult)
    await txFn(replay.tx)

    expect(replay.taskUpdate).toHaveBeenCalledWith({
      set: expect.objectContaining({
        currentStatus: 'IDLE',
        isCompleted: true,
        completedAt: expect.any(Date),
      }),
      where: eq(householdTask.id, 'task-1'),
    })
  })

  test('resolves active attention flags during completion', async () => {
    mockGetPortalAuth.mockResolvedValue(AUTH_RESULT)
    mockFindFirst.mockResolvedValue(SAMPLE_TASK)

    const completionResult = { id: 'comp-3' }
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) =>
      fn(makeTx(completionResult).tx),
    )

    const req = createJsonRequest('http://localhost:3001/api/portal/chores/task-1/complete')
    await completeChore(req, makeParams('task-1'))

    // Verify flags are resolved
    const txFn = mockTransaction.mock.calls[0][0]
    const replay = makeTx(completionResult)
    await txFn(replay.tx)

    expect(replay.flagUpdateMany).toHaveBeenCalledWith({
      set: {
        isResolved: true,
        resolvedAt: expect.any(Date),
        resolvedByCompletionId: 'comp-3',
      },
      where: and(eq(taskAttentionFlag.taskId, 'task-1'), eq(taskAttentionFlag.isResolved, false)),
    })
  })

  test('completes pending/accepted requests during completion', async () => {
    mockGetPortalAuth.mockResolvedValue(AUTH_RESULT)
    mockFindFirst.mockResolvedValue(SAMPLE_TASK)

    const completionResult = { id: 'comp-4' }
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) =>
      fn(makeTx(completionResult).tx),
    )

    const req = createJsonRequest('http://localhost:3001/api/portal/chores/task-1/complete')
    await completeChore(req, makeParams('task-1'))

    const txFn = mockTransaction.mock.calls[0][0]
    const replay = makeTx(completionResult)
    await txFn(replay.tx)

    expect(replay.requestUpdateMany).toHaveBeenCalledWith({
      set: {
        status: 'COMPLETED',
        completionId: 'comp-4',
      },
      where: and(
        eq(taskRequest.taskId, 'task-1'),
        inArray(taskRequest.status, ['PENDING', 'ACCEPTED']),
      ),
    })
  })

  test('accepts optional notes and durationMinutes', async () => {
    mockGetPortalAuth.mockResolvedValue(AUTH_RESULT)
    mockFindFirst.mockResolvedValue(SAMPLE_TASK)

    const completionResult = { id: 'comp-5' }
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) =>
      fn(makeTx(completionResult).tx),
    )

    const req = createJsonRequest('http://localhost:3001/api/portal/chores/task-1/complete', {
      notes: 'Alles erledigt',
      durationMinutes: 15,
    })
    await completeChore(req, makeParams('task-1'))

    // Verify the notes/duration are passed through the transaction
    const txFn = mockTransaction.mock.calls[0][0]
    const replay = makeTx(completionResult)
    await txFn(replay.tx)

    expect(replay.completionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        taskId: 'task-1',
        completedById: 'res-1',
        notes: 'Alles erledigt',
        durationMinutes: 15,
      }),
    )
  })

  test('works with empty body (quick-complete)', async () => {
    mockGetPortalAuth.mockResolvedValue(AUTH_RESULT)
    mockFindFirst.mockResolvedValue(SAMPLE_TASK)

    const completionResult = { id: 'comp-6' }
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) =>
      fn(makeTx(completionResult).tx),
    )

    // No body at all
    const req = new NextRequest('http://localhost:3001/api/portal/chores/task-1/complete', {
      method: 'POST',
    })
    const res = await completeChore(req, makeParams('task-1'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
  })

  test('calls logAudit after successful completion', async () => {
    mockGetPortalAuth.mockResolvedValue(AUTH_RESULT)
    mockFindFirst.mockResolvedValue(SAMPLE_TASK)

    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) =>
      fn(makeTx({ id: 'comp-audit' }).tx),
    )

    const req = createJsonRequest('http://localhost:3001/api/portal/chores/task-1/complete')
    await completeChore(req, makeParams('task-1'))

    expect(mockLogAudit).toHaveBeenCalledWith({
      action: 'UPDATE',
      entity: 'HOUSEHOLD_TASK',
      entityId: 'task-1',
      changes: { action: 'completed', completedBy: 'RES-001' },
    })
  })

  test('returns 500 when transaction fails', async () => {
    mockGetPortalAuth.mockResolvedValue(AUTH_RESULT)
    mockFindFirst.mockResolvedValue(SAMPLE_TASK)
    mockTransaction.mockRejectedValue(new Error('TX failed'))

    const req = createJsonRequest('http://localhost:3001/api/portal/chores/task-1/complete')
    const res = await completeChore(req, makeParams('task-1'))
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.success).toBe(false)
    expect(body.error).toBe(ERROR_MESSAGES.TASK_COMPLETE_ERROR)
    expect(mockLogAudit).not.toHaveBeenCalled()
  })

  test('scopes task lookup to housing unit', async () => {
    mockGetPortalAuth.mockResolvedValue(AUTH_RESULT)
    mockFindFirst.mockResolvedValue(null)

    const req = createJsonRequest('http://localhost:3001/api/portal/chores/task-1/complete')
    await completeChore(req, makeParams('task-1'))

    expect(mockFindFirst).toHaveBeenCalledWith({
      where: and(eq(householdTask.id, 'task-1'), eq(householdTask.housingUnitId, 'hu-1')),
    })
  })
})

// =============================================================================
// POST /api/portal/chores/[id]/complaint
// =============================================================================

describe('POST /api/portal/chores/[id]/complaint', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('returns 401 when not authenticated', async () => {
    mockGetPortalAuth.mockResolvedValue(null)

    const req = createJsonRequest('http://localhost:3001/api/portal/chores/task-1/complaint', {
      description: 'test',
    })
    const res = await complainChore(req, makeParams('task-1'))
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.success).toBe(false)
    expect(body.error).toBe(ERROR_MESSAGES.NOT_AUTHENTICATED)
  })

  test('returns 400 when description is missing', async () => {
    mockGetPortalAuth.mockResolvedValue(AUTH_RESULT)

    const req = createJsonRequest('http://localhost:3001/api/portal/chores/task-1/complaint', {
      description: '',
    })
    const res = await complainChore(req, makeParams('task-1'))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
  })

  test('returns 400 when body cannot be parsed as JSON', async () => {
    mockGetPortalAuth.mockResolvedValue(AUTH_RESULT)

    const req = new NextRequest('http://localhost:3001/api/portal/chores/task-1/complaint', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: 'not-json',
    })
    const res = await complainChore(req, makeParams('task-1'))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe(ERROR_MESSAGES.INVALID_INPUT)
  })

  test('returns 404 when task not found', async () => {
    mockGetPortalAuth.mockResolvedValue(AUTH_RESULT)
    mockFindFirst.mockResolvedValue(null)

    const req = createJsonRequest('http://localhost:3001/api/portal/chores/task-1/complaint', {
      description: 'Es wurde nicht geputzt',
    })
    const res = await complainChore(req, makeParams('task-1'))
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.success).toBe(false)
    expect(body.error).toBe(ERROR_MESSAGES.TASK_NOT_FOUND)
  })

  test('creates incident with CLEANING category mapped to CLEANLINESS_DISPUTE', async () => {
    mockGetPortalAuth.mockResolvedValue(AUTH_RESULT)
    mockFindFirst.mockResolvedValue({ ...SAMPLE_TASK, category: 'CLEANING' })
    mockIncidentCreate.mockResolvedValue([{ id: 'inc-1' }])

    const req = createJsonRequest('http://localhost:3001/api/portal/chores/task-1/complaint', {
      description: 'Küche nicht geputzt',
    })
    const res = await complainChore(req, makeParams('task-1'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.incidentId).toBe('inc-1')

    expect(mockIncidentCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        housingUnitId: 'hu-1',
        placementId: 'pl-1',
        reportedById: 'res-1',
        category: 'INTERPERSONAL',
        type: 'CLEANLINESS_DISPUTE',
        severity: 'MEDIUM',
        description: '[Haushaltsaufgabe: Küche putzen]\n\nKüche nicht geputzt',
        date: expect.any(Date),
      }),
    )
  })

  test('maps COOKING category to SPACE_DISPUTE incident type', async () => {
    mockGetPortalAuth.mockResolvedValue(AUTH_RESULT)
    mockFindFirst.mockResolvedValue({ ...SAMPLE_TASK, category: 'COOKING', title: 'Kochen' })
    mockIncidentCreate.mockResolvedValue([{ id: 'inc-2' }])

    const req = createJsonRequest('http://localhost:3001/api/portal/chores/task-1/complaint', {
      description: 'Kochplan nicht eingehalten',
    })
    await complainChore(req, makeParams('task-1'))

    expect(mockIncidentCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'SPACE_DISPUTE',
        description: '[Haushaltsaufgabe: Kochen]\n\nKochplan nicht eingehalten',
      }),
    )
  })

  test('maps TRASH category to CLEANLINESS_DISPUTE incident type', async () => {
    mockGetPortalAuth.mockResolvedValue(AUTH_RESULT)
    mockFindFirst.mockResolvedValue({ ...SAMPLE_TASK, category: 'TRASH', title: 'Müll' })
    mockIncidentCreate.mockResolvedValue([{ id: 'inc-3' }])

    const req = createJsonRequest('http://localhost:3001/api/portal/chores/task-1/complaint', {
      description: 'Müll nicht rausgebracht',
    })
    await complainChore(req, makeParams('task-1'))

    expect(mockIncidentCreate).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'CLEANLINESS_DISPUTE' }),
    )
  })

  test('maps MAINTENANCE category to GENERAL_MAINTENANCE incident type', async () => {
    mockGetPortalAuth.mockResolvedValue(AUTH_RESULT)
    mockFindFirst.mockResolvedValue({ ...SAMPLE_TASK, category: 'MAINTENANCE', title: 'Reparatur' })
    mockIncidentCreate.mockResolvedValue([{ id: 'inc-4' }])

    const req = createJsonRequest('http://localhost:3001/api/portal/chores/task-1/complaint', {
      description: 'Nicht repariert',
    })
    await complainChore(req, makeParams('task-1'))

    expect(mockIncidentCreate).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'GENERAL_MAINTENANCE' }),
    )
  })

  test('falls back to PERSONAL_CONFLICT for unknown categories', async () => {
    mockGetPortalAuth.mockResolvedValue(AUTH_RESULT)
    mockFindFirst.mockResolvedValue({
      ...SAMPLE_TASK,
      category: 'UNKNOWN_CATEGORY',
      title: 'Custom',
    })
    mockIncidentCreate.mockResolvedValue([{ id: 'inc-5' }])

    const req = createJsonRequest('http://localhost:3001/api/portal/chores/task-1/complaint', {
      description: 'Problem',
    })
    await complainChore(req, makeParams('task-1'))

    expect(mockIncidentCreate).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'PERSONAL_CONFLICT' }),
    )
  })

  test('calls logAudit with correct complaint data', async () => {
    mockGetPortalAuth.mockResolvedValue(AUTH_RESULT)
    mockFindFirst.mockResolvedValue(SAMPLE_TASK)
    mockIncidentCreate.mockResolvedValue([{ id: 'inc-audit' }])

    const req = createJsonRequest('http://localhost:3001/api/portal/chores/task-1/complaint', {
      description: 'Beschwerde',
    })
    await complainChore(req, makeParams('task-1'))

    expect(mockLogAudit).toHaveBeenCalledWith({
      action: 'CREATE',
      entity: 'INCIDENT',
      entityId: 'inc-audit',
      changes: {
        source: 'household_task_complaint',
        taskId: 'task-1',
        taskTitle: 'Küche putzen',
        reportedBy: 'RES-001',
      },
    })
  })

  test('returns 500 when incident creation fails', async () => {
    mockGetPortalAuth.mockResolvedValue(AUTH_RESULT)
    mockFindFirst.mockResolvedValue(SAMPLE_TASK)
    mockIncidentCreate.mockRejectedValue(new Error('DB error'))

    const req = createJsonRequest('http://localhost:3001/api/portal/chores/task-1/complaint', {
      description: 'Fail',
    })
    const res = await complainChore(req, makeParams('task-1'))
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.success).toBe(false)
    expect(body.error).toBe(ERROR_MESSAGES.TASK_COMPLAINT_ERROR)
    expect(mockLogAudit).not.toHaveBeenCalled()
  })
})

// =============================================================================
// POST /api/portal/chores/[id]/attention
// =============================================================================

describe('POST /api/portal/chores/[id]/attention', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('returns 401 when not authenticated', async () => {
    mockGetPortalAuth.mockResolvedValue(null)

    const req = createJsonRequest('http://localhost:3001/api/portal/chores/task-1/attention')
    const res = await attentionChore(req, makeParams('task-1'))
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.success).toBe(false)
    expect(body.error).toBe(ERROR_MESSAGES.NOT_AUTHENTICATED)
  })

  test('returns 404 when task not found', async () => {
    mockGetPortalAuth.mockResolvedValue(AUTH_RESULT)
    mockFindFirst.mockResolvedValue(null)

    const req = createJsonRequest('http://localhost:3001/api/portal/chores/task-1/attention')
    const res = await attentionChore(req, makeParams('task-1'))
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.success).toBe(false)
    expect(body.error).toBe(ERROR_MESSAGES.TASK_NOT_FOUND)
  })

  test('returns 400 when task is already completed', async () => {
    mockGetPortalAuth.mockResolvedValue(AUTH_RESULT)
    mockFindFirst.mockResolvedValue({ ...SAMPLE_TASK, isCompleted: true })

    const req = createJsonRequest('http://localhost:3001/api/portal/chores/task-1/attention')
    const res = await attentionChore(req, makeParams('task-1'))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
    expect(body.error).toBe(ERROR_MESSAGES.TASK_ALREADY_COMPLETED)
  })

  test('creates attention flag and updates task status', async () => {
    mockGetPortalAuth.mockResolvedValue(AUTH_RESULT)
    mockFindFirst.mockResolvedValue(SAMPLE_TASK)
    mockFlagCreate.mockResolvedValue([{ id: 'flag-1' }])
    mockUpdate.mockResolvedValue({})

    const req = createJsonRequest('http://localhost:3001/api/portal/chores/task-1/attention', {
      message: 'Dringend!',
    })
    const res = await attentionChore(req, makeParams('task-1'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data).toEqual({ id: 'flag-1' })

    expect(mockFlagCreate).toHaveBeenCalledWith({
      taskId: 'task-1',
      flaggedById: 'res-1',
      message: 'Dringend!',
    })

    expect(mockUpdate).toHaveBeenCalledWith({
      set: { currentStatus: 'NEEDS_ATTENTION' },
      where: eq(householdTask.id, 'task-1'),
    })
  })

  test('works without body (empty flag)', async () => {
    mockGetPortalAuth.mockResolvedValue(AUTH_RESULT)
    mockFindFirst.mockResolvedValue(SAMPLE_TASK)
    mockFlagCreate.mockResolvedValue([{ id: 'flag-2' }])
    mockUpdate.mockResolvedValue({})

    const req = new NextRequest('http://localhost:3001/api/portal/chores/task-1/attention', {
      method: 'POST',
    })
    const res = await attentionChore(req, makeParams('task-1'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)

    expect(mockFlagCreate).toHaveBeenCalledWith({
      taskId: 'task-1',
      flaggedById: 'res-1',
      message: null,
    })
  })

  test('sets message to null when not provided in JSON body', async () => {
    mockGetPortalAuth.mockResolvedValue(AUTH_RESULT)
    mockFindFirst.mockResolvedValue(SAMPLE_TASK)
    mockFlagCreate.mockResolvedValue([{ id: 'flag-3' }])
    mockUpdate.mockResolvedValue({})

    const req = createJsonRequest('http://localhost:3001/api/portal/chores/task-1/attention', {})
    const res = await attentionChore(req, makeParams('task-1'))

    expect(res.status).toBe(200)

    expect(mockFlagCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        message: null,
      }),
    )
  })

  test('returns 500 when flag creation fails', async () => {
    mockGetPortalAuth.mockResolvedValue(AUTH_RESULT)
    mockFindFirst.mockResolvedValue(SAMPLE_TASK)
    mockFlagCreate.mockRejectedValue(new Error('DB error'))

    const req = createJsonRequest('http://localhost:3001/api/portal/chores/task-1/attention')
    const res = await attentionChore(req, makeParams('task-1'))
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.success).toBe(false)
    expect(body.error).toBe(ERROR_MESSAGES.TASK_FLAG_ERROR)
  })

  test('scopes task lookup to housing unit', async () => {
    mockGetPortalAuth.mockResolvedValue(AUTH_RESULT)
    mockFindFirst.mockResolvedValue(null)

    const req = createJsonRequest('http://localhost:3001/api/portal/chores/task-1/attention')
    await attentionChore(req, makeParams('task-1'))

    expect(mockFindFirst).toHaveBeenCalledWith({
      where: and(eq(householdTask.id, 'task-1'), eq(householdTask.housingUnitId, 'hu-1')),
    })
  })
})

// =============================================================================
// POST /api/portal/chores/[id]/request
// =============================================================================

describe('POST /api/portal/chores/[id]/request', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('returns 401 when not authenticated', async () => {
    mockGetPortalAuth.mockResolvedValue(null)

    const req = createJsonRequest('http://localhost:3001/api/portal/chores/task-1/request', {
      message: 'Bitte erledigen',
    })
    const res = await requestChore(req, makeParams('task-1'))
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.success).toBe(false)
    expect(body.error).toBe(ERROR_MESSAGES.NOT_AUTHENTICATED)
  })

  test('returns 400 when body cannot be parsed as JSON', async () => {
    mockGetPortalAuth.mockResolvedValue(AUTH_RESULT)

    const req = new NextRequest('http://localhost:3001/api/portal/chores/task-1/request', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: 'invalid-json',
    })
    const res = await requestChore(req, makeParams('task-1'))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe(ERROR_MESSAGES.INVALID_INPUT)
  })

  test('returns 404 when task not found', async () => {
    mockGetPortalAuth.mockResolvedValue(AUTH_RESULT)
    mockFindFirst.mockResolvedValue(null)

    const req = createJsonRequest('http://localhost:3001/api/portal/chores/task-1/request', {})
    const res = await requestChore(req, makeParams('task-1'))
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.success).toBe(false)
    expect(body.error).toBe(ERROR_MESSAGES.TASK_NOT_FOUND)
  })

  test('returns 400 when task is already completed', async () => {
    mockGetPortalAuth.mockResolvedValue(AUTH_RESULT)
    mockFindFirst.mockResolvedValue({ ...SAMPLE_TASK, isCompleted: true })

    const req = createJsonRequest('http://localhost:3001/api/portal/chores/task-1/request', {})
    const res = await requestChore(req, makeParams('task-1'))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
    expect(body.error).toBe(ERROR_MESSAGES.TASK_ALREADY_COMPLETED)
  })

  test('creates targeted request when requestedResidentId is provided', async () => {
    mockGetPortalAuth.mockResolvedValue(AUTH_RESULT)
    mockFindFirst.mockResolvedValue(SAMPLE_TASK)
    mockRequestCreate.mockResolvedValue([{ id: 'req-1' }])
    mockUpdate.mockResolvedValue({})

    const req = createJsonRequest(
      'http://localhost:3001/api/portal/chores/task-1/request',
      // A real cuid: the schema requires one, and the old hand-copied mock
      // was laxer than the real schema, so this path was never truly checked.
      { requestedResidentId: 'cjld2cjxh0000qzrmn831i7rn', message: 'Bitte erledigen' },
    )
    const res = await requestChore(req, makeParams('task-1'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data).toEqual({ id: 'req-1' })

    expect(mockRequestCreate).toHaveBeenCalledWith({
      taskId: 'task-1',
      requestedById: 'res-1',
      requestedResidentId: 'cjld2cjxh0000qzrmn831i7rn',
      isBroadcast: false,
      message: 'Bitte erledigen',
    })
  })

  test('creates broadcast request when no requestedResidentId', async () => {
    mockGetPortalAuth.mockResolvedValue(AUTH_RESULT)
    mockFindFirst.mockResolvedValue(SAMPLE_TASK)
    mockRequestCreate.mockResolvedValue([{ id: 'req-2' }])
    mockUpdate.mockResolvedValue({})

    const req = createJsonRequest('http://localhost:3001/api/portal/chores/task-1/request', {
      message: 'Wer kann das machen?',
    })
    const res = await requestChore(req, makeParams('task-1'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)

    expect(mockRequestCreate).toHaveBeenCalledWith({
      taskId: 'task-1',
      requestedById: 'res-1',
      requestedResidentId: null,
      isBroadcast: true,
      message: 'Wer kann das machen?',
    })
  })

  test('updates task status to REQUESTED', async () => {
    mockGetPortalAuth.mockResolvedValue(AUTH_RESULT)
    mockFindFirst.mockResolvedValue(SAMPLE_TASK)
    mockRequestCreate.mockResolvedValue([{ id: 'req-3' }])
    mockUpdate.mockResolvedValue({})

    const req = createJsonRequest('http://localhost:3001/api/portal/chores/task-1/request', {})
    await requestChore(req, makeParams('task-1'))

    expect(mockUpdate).toHaveBeenCalledWith({
      set: { currentStatus: 'REQUESTED' },
      where: eq(householdTask.id, 'task-1'),
    })
  })

  test('sets message to null when not provided', async () => {
    mockGetPortalAuth.mockResolvedValue(AUTH_RESULT)
    mockFindFirst.mockResolvedValue(SAMPLE_TASK)
    mockRequestCreate.mockResolvedValue([{ id: 'req-4' }])
    mockUpdate.mockResolvedValue({})

    const req = createJsonRequest('http://localhost:3001/api/portal/chores/task-1/request', {})
    await requestChore(req, makeParams('task-1'))

    expect(mockRequestCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        message: null,
      }),
    )
  })

  test('returns 500 when request creation fails', async () => {
    mockGetPortalAuth.mockResolvedValue(AUTH_RESULT)
    mockFindFirst.mockResolvedValue(SAMPLE_TASK)
    mockRequestCreate.mockRejectedValue(new Error('DB error'))

    const req = createJsonRequest('http://localhost:3001/api/portal/chores/task-1/request', {})
    const res = await requestChore(req, makeParams('task-1'))
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.success).toBe(false)
    expect(body.error).toBe(ERROR_MESSAGES.TASK_REQUEST_ERROR)
  })

  test('scopes task lookup to housing unit', async () => {
    mockGetPortalAuth.mockResolvedValue(AUTH_RESULT)
    mockFindFirst.mockResolvedValue(null)

    const req = createJsonRequest('http://localhost:3001/api/portal/chores/task-1/request', {})
    await requestChore(req, makeParams('task-1'))

    expect(mockFindFirst).toHaveBeenCalledWith({
      where: and(eq(householdTask.id, 'task-1'), eq(householdTask.housingUnitId, 'hu-1')),
    })
  })
})
