import { isAchievementRecord, kindTracksHours } from '@/lib/config/learning'

describe('learning records', () => {
  it('treats completed tests, courses, qualifications and service as achievements', () => {
    expect(isAchievementRecord({ status: 'COMPLETED', kind: 'LANGUAGE_TEST' })).toBe(true)
    expect(isAchievementRecord({ status: 'COMPLETED', kind: 'VOLUNTEERING' })).toBe(true)
    expect(isAchievementRecord({ status: 'IN_PROGRESS', kind: 'COURSE' })).toBe(false)
    expect(isAchievementRecord({ status: 'COMPLETED', kind: 'INFORMAL' })).toBe(false)
  })

  it('tracks hours on courses and service, not on tests', () => {
    expect(kindTracksHours('COURSE')).toBe(true)
    expect(kindTracksHours('VOLUNTEERING')).toBe(true)
    expect(kindTracksHours('LANGUAGE_TEST')).toBe(false)
  })
})
