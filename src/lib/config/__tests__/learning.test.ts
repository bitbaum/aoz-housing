import {
  boardKinds,
  defaultLearningBoardForRole,
  isAchievementRecord,
  kindTracksHours,
} from '@/lib/config/learning'

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

  it('maps job and volunteering boards to the right evidence kinds', () => {
    // The job board previously held only the preparation — language tests,
    // courses, qualifications — and none of the placements, because no kind
    // existed for a job or a Praktikum. Both now belong on the coach's board.
    expect(boardKinds('job')).toEqual([
      'LANGUAGE_TEST',
      'COURSE',
      'QUALIFICATION',
      'EMPLOYMENT',
      'INTERNSHIP',
    ])
    expect(boardKinds('volunteering')).toEqual(['VOLUNTEERING', 'COMMUNITY_SERVICE'])
  })

  it('defaults the board by staff role', () => {
    expect(defaultLearningBoardForRole('JOBCOACH')).toBe('job')
    expect(defaultLearningBoardForRole('FREIWILLIGENARBEIT')).toBe('volunteering')
    expect(defaultLearningBoardForRole('SOZIALARBEIT')).toBe('overview')
  })
})
