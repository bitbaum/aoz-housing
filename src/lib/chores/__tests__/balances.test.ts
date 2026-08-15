import {
  DEFAULT_CHORE_MINUTES,
  completionMinutes,
  computeChoreBalances,
} from '../balances'

describe('completionMinutes', () => {
  it('prefers the logged duration over the task estimate', () => {
    expect(
      completionMinutes({ completedById: 'a', durationMinutes: 40, taskEstimatedMinutes: 10 })
    ).toBe(40)
  })

  it('falls back to the task estimate when nothing was logged', () => {
    expect(
      completionMinutes({ completedById: 'a', durationMinutes: null, taskEstimatedMinutes: 25 })
    ).toBe(25)
  })

  it('falls back to the default when neither is known', () => {
    expect(completionMinutes({ completedById: 'a' })).toBe(DEFAULT_CHORE_MINUTES)
  })

  it('ignores non-positive values rather than crediting zero minutes', () => {
    expect(
      completionMinutes({ completedById: 'a', durationMinutes: 0, taskEstimatedMinutes: 30 })
    ).toBe(30)
  })
})

describe('computeChoreBalances', () => {
  const members = ['ihor', 'misha', 'alex']

  it('returns every member at zero before any chore is done', () => {
    const balances = computeChoreBalances([], members)

    expect(balances).toHaveLength(3)
    expect(balances.every(b => b.doneMinutes === 0 && b.balanceMinutes === 0)).toBe(true)
  })

  it('weights by time, not by number of completions', () => {
    // Ihor did four 5-minute bin runs; Misha scrubbed the shower once for 40.
    // Row-counting would call Ihor the biggest contributor by 4:1.
    const balances = computeChoreBalances(
      [
        { completedById: 'ihor', durationMinutes: 5 },
        { completedById: 'ihor', durationMinutes: 5 },
        { completedById: 'ihor', durationMinutes: 5 },
        { completedById: 'ihor', durationMinutes: 5 },
        { completedById: 'misha', durationMinutes: 40 },
      ],
      members
    )

    const ihor = balances.find(b => b.residentId === 'ihor')!
    const misha = balances.find(b => b.residentId === 'misha')!

    expect(ihor.doneMinutes).toBe(20)
    expect(misha.doneMinutes).toBe(40)
    expect(misha.balanceMinutes).toBeGreaterThan(ihor.balanceMinutes)
  })

  it('splits the total evenly and reports who is ahead and behind', () => {
    const balances = computeChoreBalances(
      [
        { completedById: 'ihor', durationMinutes: 60 },
        { completedById: 'misha', durationMinutes: 30 },
      ],
      members
    )

    // 90 minutes over 3 people = 30 each.
    expect(balances.every(b => b.shareMinutes === 30)).toBe(true)
    expect(balances.find(b => b.residentId === 'ihor')!.balanceMinutes).toBe(30)
    expect(balances.find(b => b.residentId === 'misha')!.balanceMinutes).toBe(0)
    expect(balances.find(b => b.residentId === 'alex')!.balanceMinutes).toBe(-30)
  })

  it('always sums to zero — the invariant the whole ledger rests on', () => {
    const balances = computeChoreBalances(
      [
        { completedById: 'ihor', durationMinutes: 17 },
        { completedById: 'misha', taskEstimatedMinutes: 23 },
        { completedById: 'alex' },
        { completedById: 'alex', durationMinutes: 5 },
      ],
      members
    )

    const total = balances.reduce((sum, b) => sum + b.balanceMinutes, 0)
    expect(Math.abs(total)).toBeLessThan(1e-9)
  })

  it('keeps a departed resident in the split so the invariant survives', () => {
    // Someone moved out mid-month having done real work. Dropping them would
    // make the balances stop summing to zero and silently inflate everyone else.
    const balances = computeChoreBalances(
      [
        { completedById: 'ihor', durationMinutes: 30 },
        { completedById: 'departed', durationMinutes: 30 },
      ],
      members
    )

    expect(balances.map(b => b.residentId)).toEqual([...members, 'departed'])
    expect(balances.every(b => b.shareMinutes === 15)).toBe(true)

    const total = balances.reduce((sum, b) => sum + b.balanceMinutes, 0)
    expect(Math.abs(total)).toBeLessThan(1e-9)
  })

  it('returns nothing at all when there is no household and no history', () => {
    expect(computeChoreBalances([], [])).toEqual([])
  })

  it('preserves member order so the summary does not reshuffle between renders', () => {
    const balances = computeChoreBalances(
      [{ completedById: 'alex', durationMinutes: 10 }],
      members
    )

    expect(balances.map(b => b.residentId)).toEqual(members)
  })
})
