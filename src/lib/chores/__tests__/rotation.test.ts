import { currentTurnResidentId, isResidentsTurn } from '../rotation'

describe('currentTurnResidentId', () => {
  const rota = ['ihor', 'misha', 'alex']

  it('starts at the first person in the rotation', () => {
    expect(currentTurnResidentId(rota, 0)).toBe('ihor')
  })

  it('advances one place per completion and wraps around', () => {
    expect(currentTurnResidentId(rota, 1)).toBe('misha')
    expect(currentTurnResidentId(rota, 2)).toBe('alex')
    expect(currentTurnResidentId(rota, 3)).toBe('ihor')
    expect(currentTurnResidentId(rota, 7)).toBe('misha')
  })

  it('advances even when someone else covered the turn', () => {
    // Alex doing Ihor's turn still moves the rota on: covering for a housemate
    // must not cost you your own place in the queue.
    expect(currentTurnResidentId(rota, 0)).toBe('ihor')
    expect(currentTurnResidentId(rota, 1)).toBe('misha')
  })

  it('returns null when the house keeps no rotation for this task', () => {
    expect(currentTurnResidentId([], 4)).toBeNull()
  })

  it('handles a one-person rotation without dividing by zero', () => {
    expect(currentTurnResidentId(['ihor'], 99)).toBe('ihor')
  })

  it('does not produce a nonsense index for an impossible count', () => {
    expect(currentTurnResidentId(rota, -3)).toBe('ihor')
  })
})

describe('isResidentsTurn', () => {
  const rota = ['ihor', 'misha']

  it('is true only for the person currently up', () => {
    expect(isResidentsTurn(rota, 0, 'ihor')).toBe(true)
    expect(isResidentsTurn(rota, 0, 'misha')).toBe(false)
  })

  it('is false for everyone when there is no rotation', () => {
    expect(isResidentsTurn([], 0, 'ihor')).toBe(false)
  })
})
