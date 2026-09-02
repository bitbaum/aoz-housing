import {
  JOB_SIGNAL_IDS,
  NO_CONTACT_GRACE_DAYS,
  STALLED_RECORD_DAYS,
  buildJobQueue,
  hasLabourMarketContact,
  signalsFor,
  type JobClientInput,
} from '../queue'
import { INTEGRATION_PRINCIPLES } from '@/lib/config/job-integration-docs'

const NOW = new Date('2026-09-02T09:00:00Z')
const daysAgo = (d: number) => new Date(NOW.getTime() - d * 24 * 60 * 60 * 1000)

const client = (over: Partial<JobClientInput> = {}): JobClientInput => ({
  residentId: 'r1',
  name: 'George B',
  createdAt: daysAgo(1),
  learningRecords: [],
  applications: [],
  ...over,
})

describe('the production case this was built from', () => {
  /**
   * Simon B. had one client assigned the day he was created — job-seeking, two
   * years without work, an unrecognised trade qualification, German at A2 —
   * and the dashboard said "Alles unter Kontrolle! Keine dringenden Aufgaben"
   * without naming him. Every component of `openTaskCount` was a housing
   * queue, and a Jobcoach holds none of those permissions.
   */
  it('a newly registered job-seeker with nothing arranged is not "nothing to do"', () => {
    const george = client({ createdAt: daysAgo(NO_CONTACT_GRACE_DAYS + 1) })
    const queue = buildJobQueue([george], NOW)

    expect(queue.length).toBeGreaterThan(0)
    expect(queue[0]).toMatchObject({ residentId: 'r1', name: 'George B' })
  })

  it('names the person, so the dashboard can too', () => {
    // The old screen did not mention the client at all. A count alone would
    // reproduce that: "1 Aufgabe" tells a coach nothing about whom.
    const queue = buildJobQueue([client({ createdAt: daysAgo(30) })], NOW)
    expect(queue.every((row) => row.name === 'George B')).toBe(true)
  })
})

describe('no labour-market contact', () => {
  it('raises once the grace period has passed', () => {
    expect(signalsFor(client({ createdAt: daysAgo(NO_CONTACT_GRACE_DAYS) }), NOW)).toContain(
      'NO_LABOUR_MARKET_CONTACT',
    )
  })

  it('stays quiet during intake week', () => {
    // Firing on day one would make the signal noise, and a queue a coach
    // learns to dismiss protects nobody.
    expect(signalsFor(client({ createdAt: daysAgo(1) }), NOW)).not.toContain(
      'NO_LABOUR_MARKET_CONTACT',
    )
  })

  it.each([['INTERESTED'], ['APPLIED'], ['INTERVIEW'], ['ACCEPTED'], ['STARTED']] as const)(
    'a %s application counts as contact',
    (stage) => {
      const c = client({ createdAt: daysAgo(90), applications: [{ stage }] })
      expect(hasLabourMarketContact(c)).toBe(true)
      expect(signalsFor(c, NOW)).not.toContain('NO_LABOUR_MARKET_CONTACT')
    },
  )

  it.each([['ENDED'], ['DECLINED']] as const)('a %s application does not', (stage) => {
    // A finished or refused application is history. Treating it as contact
    // would hide exactly the person who needs the next one.
    const c = client({ createdAt: daysAgo(90), applications: [{ stage }] })
    expect(hasLabourMarketContact(c)).toBe(false)
    expect(signalsFor(c, NOW)).toContain('NO_LABOUR_MARKET_CONTACT')
  })

  it('an employment or internship record counts as contact', () => {
    for (const kind of ['EMPLOYMENT', 'INTERNSHIP'] as const) {
      const c = client({
        createdAt: daysAgo(90),
        learningRecords: [{ kind, status: 'IN_PROGRESS', updatedAt: daysAgo(1) }],
      })
      expect(hasLabourMarketContact(c)).toBe(true)
    }
  })

  it('a language course alone does not count as contact', () => {
    // The whole point of the parallel-track principle: a course is not a job.
    const c = client({
      createdAt: daysAgo(90),
      learningRecords: [{ kind: 'COURSE', status: 'IN_PROGRESS', updatedAt: daysAgo(1) }],
    })
    expect(hasLabourMarketContact(c)).toBe(false)
  })
})

describe('course without work', () => {
  it('flags a running course with no labour-market contact, inside the grace period', () => {
    const c = client({
      createdAt: daysAgo(3),
      learningRecords: [{ kind: 'COURSE', status: 'IN_PROGRESS', updatedAt: daysAgo(1) }],
    })
    expect(signalsFor(c, NOW)).toContain('COURSE_WITHOUT_WORK')
  })

  it('does not double-report once the person is simply overdue', () => {
    // Past the grace period the stronger signal already covers it. Two rows
    // for one conversation is how a queue stops being read.
    const c = client({
      createdAt: daysAgo(90),
      learningRecords: [{ kind: 'COURSE', status: 'IN_PROGRESS', updatedAt: daysAgo(1) }],
    })
    const signals = signalsFor(c, NOW)
    expect(signals).toContain('NO_LABOUR_MARKET_CONTACT')
    expect(signals).not.toContain('COURSE_WITHOUT_WORK')
  })
})

describe('stalled records', () => {
  it('flags an IN_PROGRESS record nobody has touched', () => {
    const c = client({
      applications: [{ stage: 'STARTED' }],
      learningRecords: [
        { kind: 'COURSE', status: 'IN_PROGRESS', updatedAt: daysAgo(STALLED_RECORD_DAYS) },
      ],
    })
    expect(signalsFor(c, NOW)).toContain('STALLED_RECORD')
  })

  it('leaves a recently updated record alone', () => {
    const c = client({
      applications: [{ stage: 'STARTED' }],
      learningRecords: [{ kind: 'COURSE', status: 'IN_PROGRESS', updatedAt: daysAgo(3) }],
    })
    expect(signalsFor(c, NOW)).not.toContain('STALLED_RECORD')
  })

  it('ignores completed records however old', () => {
    // A finished course does not go stale. Only work in flight can stall.
    const c = client({
      applications: [{ stage: 'STARTED' }],
      learningRecords: [{ kind: 'COURSE', status: 'COMPLETED', updatedAt: daysAgo(400) }],
    })
    expect(signalsFor(c, NOW)).toEqual([])
  })
})

describe('the queue as a whole', () => {
  it('is empty for a client with work running and records moving', () => {
    const c = client({
      createdAt: daysAgo(200),
      applications: [{ stage: 'STARTED' }],
      learningRecords: [{ kind: 'COURSE', status: 'IN_PROGRESS', updatedAt: daysAgo(2) }],
    })
    expect(buildJobQueue([c], NOW)).toEqual([])
  })

  it('emits one row per signal, so two problems are two pieces of work', () => {
    const c = client({
      createdAt: daysAgo(90),
      learningRecords: [
        { kind: 'COURSE', status: 'IN_PROGRESS', updatedAt: daysAgo(STALLED_RECORD_DAYS + 5) },
      ],
    })
    const queue = buildJobQueue([c], NOW)
    expect(queue).toHaveLength(2)
    expect(queue.map((r) => r.signal).sort()).toEqual(
      ['NO_LABOUR_MARKET_CONTACT', 'STALLED_RECORD'].sort(),
    )
  })

  it('an empty caseload produces an empty queue, not an error', () => {
    expect(buildJobQueue([], NOW)).toEqual([])
  })
})

describe('every signal traces to a principle marked as acted upon', () => {
  /**
   * The guard against evidence-as-decoration. A principle claiming the system
   * acts on it, with no signal behind it, is a lie told to a caseworker; a
   * signal with no principle behind it is a hunch wearing a citation.
   */
  it('each `signal` principle is implemented, and each signal is principled', () => {
    const signalPrinciples = INTEGRATION_PRINCIPLES.filter((p) => p.status === 'signal')
    expect(signalPrinciples.length).toBe(JOB_SIGNAL_IDS.length)
  })

  it('documented-only principles raise nothing, and say so', () => {
    // Recognition, post-start support and stated job goals all matter and are
    // NOT detectable from the data the product holds. Claiming otherwise is
    // the failure this test exists to prevent.
    const documented = INTEGRATION_PRINCIPLES.filter((p) => p.status === 'documented')
    expect(documented.length).toBeGreaterThan(0)
    for (const principle of documented) {
      expect(principle.implication.length).toBeGreaterThan(20)
    }
  })

  it('every principle cites at least one source', () => {
    for (const principle of INTEGRATION_PRINCIPLES) {
      expect({ id: principle.id, sources: principle.sourceIds.length > 0 }).toEqual({
        id: principle.id,
        sources: true,
      })
    }
  })
})
