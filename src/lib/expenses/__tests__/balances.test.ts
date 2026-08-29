import { computeBalances, simplifyDebts } from '../balances'
import { splitEqually } from '../split'

const MEMBERS = ['georgy', 'ihor', 'misha', 'alex']

function expense(paidById: string, amountRappen: number, participants = MEMBERS) {
  return { paidById, amountRappen, shares: splitEqually(amountRappen, participants) }
}

describe('computeBalances', () => {
  it('starts every member at zero', () => {
    const balances = computeBalances([], [], MEMBERS)
    expect(Array.from(balances.values())).toEqual([0, 0, 0, 0])
  })

  it('credits the payer and debits the sharers', () => {
    const balances = computeBalances([expense('georgy', 4000)], [], MEMBERS)
    expect(balances.get('georgy')).toBe(3000) // paid 4000, own share 1000
    expect(balances.get('ihor')).toBe(-1000)
    expect(balances.get('misha')).toBe(-1000)
    expect(balances.get('alex')).toBe(-1000)
  })

  it('handles a payer who is not a participant', () => {
    const balances = computeBalances(
      [expense('georgy', 3000, ['ihor', 'misha', 'alex'])],
      [],
      MEMBERS,
    )
    expect(balances.get('georgy')).toBe(3000)
    expect(balances.get('ihor')).toBe(-1000)
  })

  it('applies settlements: paying a debt moves both balances toward zero', () => {
    const balances = computeBalances(
      [expense('georgy', 4000)],
      [{ fromId: 'ihor', toId: 'georgy', amountRappen: 1000 }],
      MEMBERS,
    )
    expect(balances.get('ihor')).toBe(0)
    expect(balances.get('georgy')).toBe(2000)
  })

  it('includes past residents present in the data but not in memberIds', () => {
    const balances = computeBalances([expense('former', 1200, ['former', 'georgy'])], [], MEMBERS)
    expect(balances.get('former')).toBe(600)
    expect(balances.get('georgy')).toBe(-600)
  })

  it('always sums to zero (money must balance)', () => {
    const expenses = [
      expense('georgy', 4999),
      expense('ihor', 333, ['ihor', 'misha']),
      expense('alex', 10001, ['georgy', 'alex', 'misha']),
    ]
    const settlements = [
      { fromId: 'misha', toId: 'georgy', amountRappen: 700 },
      { fromId: 'ihor', toId: 'alex', amountRappen: 123 },
    ]
    const balances = computeBalances(expenses, settlements, MEMBERS)
    expect(Array.from(balances.values()).reduce((a, b) => a + b, 0)).toBe(0)
  })
})

describe('simplifyDebts', () => {
  it('settles all balances with at most n−1 transfers', () => {
    const balances = computeBalances(
      [expense('georgy', 4000), expense('ihor', 2000), expense('misha', 1000)],
      [],
      MEMBERS,
    )
    const transfers = simplifyDebts(balances)
    expect(transfers.length).toBeLessThanOrEqual(MEMBERS.length - 1)

    // Applying the plan must bring every balance to exactly zero.
    const after = new Map(balances)
    for (const t of transfers) {
      after.set(t.fromId, (after.get(t.fromId) ?? 0) + t.amountRappen)
      after.set(t.toId, (after.get(t.toId) ?? 0) - t.amountRappen)
    }
    for (const value of Array.from(after.values())) expect(value).toBe(0)
  })

  it('returns an empty plan when everyone is settled', () => {
    expect(simplifyDebts(computeBalances([], [], MEMBERS))).toEqual([])
  })

  it('is deterministic: equal balances break ties by id', () => {
    const balances = new Map([
      ['b', -500],
      ['a', -500],
      ['z', 1000],
    ])
    expect(simplifyDebts(balances)).toEqual([
      { fromId: 'a', toId: 'z', amountRappen: 500 },
      { fromId: 'b', toId: 'z', amountRappen: 500 },
    ])
  })

  it('never emits a zero or negative transfer', () => {
    const balances = computeBalances([expense('georgy', 1)], [], MEMBERS)
    for (const t of simplifyDebts(balances)) {
      expect(t.amountRappen).toBeGreaterThan(0)
    }
  })
})
