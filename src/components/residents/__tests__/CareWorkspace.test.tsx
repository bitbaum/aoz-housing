import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { CareWorkspace } from '../CareWorkspace'
import { CARE_ROLES, CARE_ROLE_LABELS, writableCareDomains } from '@/lib/config/care'
import { ASSIGNABLE_STAFF_ROLES, type StaffRole } from '@/lib/auth/role-policy'

/**
 * The workspace is an access boundary, not a form with some disabled inputs.
 *
 * It used to map over CARE_ROLES and pass the writable set down as an edit
 * flag, so every staff member READ all four domains and merely could not type
 * in three of them. A job coach opening any client saw Housing's "Schlüssel:
 * fehlt" and Sozialarbeit's "Nächster Schritt" — notes another discipline
 * wrote about a person, on a page he opened to do a different job.
 *
 * A rendering test is the only thing that catches a regression here: putting
 * `CARE_ROLES.map` back type-checks, lints and looks completely fine.
 */

jest.mock('@/lib/actions/care', () => ({
  createAppointment: jest.fn(),
  saveCareAttributes: jest.fn(),
  setAppointmentStatus: jest.fn(),
}))

jest.mock('lucide-react', () => ({
  ChevronDown: () => <span data-testid="chevron" />,
}))

function renderFor(role: StaffRole) {
  return render(
    <CareWorkspace
      residentId="res-1"
      attributes={[]}
      appointments={[]}
      writableDomains={writableCareDomains({ role, scope: 'OWN_DOMAIN', isSystemAdmin: false })}
    />
  )
}

describe('CareWorkspace domain boundary', () => {
  it.each(ASSIGNABLE_STAFF_ROLES.map((role) => [role]))(
    '%s is shown their own seats and no others',
    (role) => {
      renderFor(role)
      const own = writableCareDomains({ role, scope: 'OWN_DOMAIN', isSystemAdmin: false })

      for (const domain of CARE_ROLES) {
        const heading = CARE_ROLE_LABELS[domain]
        if (own.includes(domain)) {
          expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument()
        } else {
          expect(screen.queryByRole('heading', { name: heading })).not.toBeInTheDocument()
        }
      }
    }
  )

  it('shows a job coach exactly one seat, and not the housing or social ones', () => {
    renderFor('JOBCOACH')

    expect(screen.getByRole('heading', { name: CARE_ROLE_LABELS.JOB })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: CARE_ROLE_LABELS.HOUSING })).toBeNull()
    expect(screen.queryByRole('heading', { name: CARE_ROLE_LABELS.SOCIAL })).toBeNull()
    expect(screen.queryByRole('heading', { name: CARE_ROLE_LABELS.VOLUNTEERING })).toBeNull()
  })

  it('gives a viewer with oversight all four seats — whatever their role', () => {
    // This is Franziska: a Betreuerin who also covers every seat. It used to
    // require the ADMIN role, which erased the fact that housing is her
    // domain. Breadth is now its own axis, so the role stays true.
    render(
      <CareWorkspace
        residentId="res-1"
        attributes={[]}
        appointments={[]}
        writableDomains={writableCareDomains({
          role: 'BETREUUNG',
          scope: 'ALL_DOMAINS',
          isSystemAdmin: false,
        })}
      />
    )

    for (const domain of CARE_ROLES) {
      expect(
        screen.getByRole('heading', { name: CARE_ROLE_LABELS[domain] })
      ).toBeInTheDocument()
    }
  })

  it('renders nothing at all rather than an empty card when no seat is readable', () => {
    const { container } = render(
      <CareWorkspace residentId="res-1" attributes={[]} appointments={[]} writableDomains={[]} />
    )

    // An empty "Begleitung" card with a dangling subtitle reads as a broken
    // page; absence is the honest rendering of "this is not your surface".
    expect(container).toBeEmptyDOMElement()
  })
})
