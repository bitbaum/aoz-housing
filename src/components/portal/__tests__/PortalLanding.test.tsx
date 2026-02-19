import '@testing-library/jest-dom'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PortalLanding } from '../PortalLanding'

// =============================================================================
// MOCKS
// =============================================================================

jest.mock('next/link', () => {
  return function MockLink({
    children,
    href,
    className,
  }: {
    children: React.ReactNode
    href: string
    className?: string
  }) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    )
  }
})

// Mock PORTAL_LABELS from the constants
jest.mock('@/lib/constants/labels', () => ({
  PORTAL_LABELS: {
    landing: {
      hero: 'Willkommen bei Mein Zuhause',
      heroSubtitle: 'Hier findest du alles rund um deine Unterkunft.',
      features: [
        { icon: 'house-icon', title: 'Deine Unterkunft', desc: 'Feature 1 description' },
        { icon: 'chat-icon', title: 'Probleme melden', desc: 'Feature 2 description' },
        { icon: 'gear-icon', title: 'Deine Einstellungen', desc: 'Feature 3 description' },
      ],
      loginTitle: 'Bereits registriert?',
      loginDesc: 'Melde dich mit deinem Bewohnercode an',
      registerTitle: 'Neu hier?',
      registerDesc: 'Erstelle in 30 Sekunden dein Profil',
      registerButton: 'Profil erstellen',
      registerSuccess: 'Profil erstellt! Dein Code ist:',
      registerAgeRange: 'Altersgruppe',
      registerGender: 'Geschlecht',
      registerFamilyStatus: 'Familienstatus',
      registerLanguages: 'Sprachen (optional)',
      registerCreating: 'Wird erstellt...',
      registerSelectPlaceholder: 'Bitte auswaehlen...',
      staffLink: 'Mitarbeitende? Zum Mitarbeiter-Login',
    },
    login: {
      placeholder: 'Dein Code (z.B. RES-001)',
      submit: 'Einloggen',
      hint: 'Deinen Code findest du auf deinem Willkommensbrief',
      errors: {
        code_required: 'Bitte Code eingeben',
        invalid_code: 'Code nicht gefunden',
        rate_limited: 'Zu viele Versuche.',
        account_not_found: 'Konto nicht gefunden.',
      },
    },
    form: {
      errorGeneric: 'Ein Fehler ist aufgetreten.',
    },
  },
}))

// Mock resident factors config
jest.mock('@/lib/config/resident-factors', () => ({
  RESIDENT_FACTORS: {
    languages: {
      options: ['DE', 'EN', 'FR', 'AR', 'FA', 'TR', 'TI', 'UK'] as const,
      optionLabels: {
        DE: 'Deutsch',
        EN: 'Englisch',
        FR: 'Franzoesisch',
        AR: 'Arabisch',
        FA: 'Farsi',
        TR: 'Tuerkisch',
        TI: 'Tigrinya',
        UK: 'Ukrainisch',
      },
    },
    ageRange: {
      options: ['YOUNG_ADULT', 'ADULT', 'MIDDLE_AGED', 'SENIOR'] as const,
      optionLabels: {
        YOUNG_ADULT: '18-25 Jahre',
        ADULT: '26-40 Jahre',
        MIDDLE_AGED: '41-55 Jahre',
        SENIOR: '56+ Jahre',
      },
    },
    gender: {
      options: ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_SAY'] as const,
      optionLabels: {
        MALE: 'Maennlich',
        FEMALE: 'Weiblich',
        OTHER: 'Andere',
        PREFER_NOT_SAY: 'Keine Angabe',
      },
    },
    familyStatus: {
      options: ['SINGLE', 'COUPLE', 'FAMILY_WITH_CHILDREN', 'SINGLE_PARENT'] as const,
      optionLabels: {
        SINGLE: 'Alleinstehend',
        COUPLE: 'Paar',
        FAMILY_WITH_CHILDREN: 'Familie mit Kindern',
        SINGLE_PARENT: 'Alleinerziehend',
      },
    },
  },
}))

// =============================================================================
// TESTS
// =============================================================================

describe('PortalLanding', () => {
  describe('hero section', () => {
    it('renders hero title and subtitle', () => {
      render(<PortalLanding />)

      expect(screen.getByText('Willkommen bei Mein Zuhause')).toBeInTheDocument()
      expect(
        screen.getByText('Hier findest du alles rund um deine Unterkunft.')
      ).toBeInTheDocument()
    })
  })

  describe('feature cards', () => {
    it('renders all three feature cards', () => {
      render(<PortalLanding />)

      expect(screen.getByText('Deine Unterkunft')).toBeInTheDocument()
      expect(screen.getByText('Probleme melden')).toBeInTheDocument()
      expect(screen.getByText('Deine Einstellungen')).toBeInTheDocument()
    })

    it('renders feature descriptions', () => {
      render(<PortalLanding />)

      expect(screen.getByText('Feature 1 description')).toBeInTheDocument()
      expect(screen.getByText('Feature 2 description')).toBeInTheDocument()
      expect(screen.getByText('Feature 3 description')).toBeInTheDocument()
    })
  })

  describe('login section', () => {
    it('renders login form with title', () => {
      render(<PortalLanding />)

      expect(screen.getByText('Bereits registriert?')).toBeInTheDocument()
      expect(screen.getByText('Melde dich mit deinem Bewohnercode an')).toBeInTheDocument()
    })

    it('renders code input with placeholder', () => {
      render(<PortalLanding />)

      expect(
        screen.getByPlaceholderText('Dein Code (z.B. RES-001)')
      ).toBeInTheDocument()
    })

    it('renders login button', () => {
      render(<PortalLanding />)

      expect(screen.getByText('Einloggen')).toBeInTheDocument()
    })

    it('shows login hint', () => {
      render(<PortalLanding />)

      expect(
        screen.getByText('Deinen Code findest du auf deinem Willkommensbrief')
      ).toBeInTheDocument()
    })

    it('makes code input required', () => {
      render(<PortalLanding />)

      const input = screen.getByPlaceholderText('Dein Code (z.B. RES-001)')
      expect(input).toBeRequired()
    })

    it('login form posts to correct action', () => {
      render(<PortalLanding />)

      const form = screen.getByPlaceholderText('Dein Code (z.B. RES-001)').closest('form')
      expect(form).toHaveAttribute('action', '/api/portal/login')
      expect(form).toHaveAttribute('method', 'POST')
    })
  })

  describe('login errors', () => {
    it('shows code_required error', () => {
      render(<PortalLanding error="code_required" />)

      expect(screen.getByText('Bitte Code eingeben')).toBeInTheDocument()
    })

    it('shows invalid_code error', () => {
      render(<PortalLanding error="invalid_code" />)

      expect(screen.getByText('Code nicht gefunden')).toBeInTheDocument()
    })

    it('shows rate_limited error', () => {
      render(<PortalLanding error="rate_limited" />)

      expect(screen.getByText('Zu viele Versuche.')).toBeInTheDocument()
    })

    it('shows account_not_found error', () => {
      render(<PortalLanding error="account_not_found" />)

      expect(screen.getByText('Konto nicht gefunden.')).toBeInTheDocument()
    })

    it('shows unknown error string as-is', () => {
      render(<PortalLanding error="some_unknown_error" />)

      expect(screen.getByText('some_unknown_error')).toBeInTheDocument()
    })

    it('does not show error when no error prop', () => {
      render(<PortalLanding />)

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('error has alert role for accessibility', () => {
      render(<PortalLanding error="invalid_code" />)

      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })

  describe('register section', () => {
    it('renders registration form with title', () => {
      render(<PortalLanding />)

      expect(screen.getByText('Neu hier?')).toBeInTheDocument()
      expect(screen.getByText('Erstelle in 30 Sekunden dein Profil')).toBeInTheDocument()
    })

    it('renders age range select', () => {
      render(<PortalLanding />)

      expect(screen.getByLabelText('Altersgruppe')).toBeInTheDocument()
      expect(screen.getByText('18-25 Jahre')).toBeInTheDocument()
      expect(screen.getByText('26-40 Jahre')).toBeInTheDocument()
    })

    it('renders gender select', () => {
      render(<PortalLanding />)

      expect(screen.getByLabelText('Geschlecht')).toBeInTheDocument()
      expect(screen.getByText('Maennlich')).toBeInTheDocument()
      expect(screen.getByText('Weiblich')).toBeInTheDocument()
    })

    it('renders family status select', () => {
      render(<PortalLanding />)

      expect(screen.getByLabelText('Familienstatus')).toBeInTheDocument()
      expect(screen.getByText('Alleinstehend')).toBeInTheDocument()
      expect(screen.getByText('Paar')).toBeInTheDocument()
    })

    it('renders language toggle buttons', () => {
      render(<PortalLanding />)

      expect(screen.getByText('Sprachen (optional)')).toBeInTheDocument()
      // First 6 language options
      expect(screen.getByText('Deutsch')).toBeInTheDocument()
      expect(screen.getByText('Englisch')).toBeInTheDocument()
      expect(screen.getByText('Franzoesisch')).toBeInTheDocument()
      expect(screen.getByText('Arabisch')).toBeInTheDocument()
      expect(screen.getByText('Farsi')).toBeInTheDocument()
      expect(screen.getByText('Tuerkisch')).toBeInTheDocument()
    })

    it('renders register button', () => {
      render(<PortalLanding />)

      expect(screen.getByText('Profil erstellen')).toBeInTheDocument()
    })

    it('toggles language selection on click', async () => {
      const user = userEvent.setup()
      render(<PortalLanding />)

      const deutschBtn = screen.getByText('Deutsch')

      // Initially not selected (no bg-aoz-secondary class)
      expect(deutschBtn.className).toContain('bg-gray-100')

      await user.click(deutschBtn)

      // After click, should be selected
      expect(deutschBtn.className).toContain('bg-aoz-secondary')

      // Click again to deselect
      await user.click(deutschBtn)

      expect(deutschBtn.className).toContain('bg-gray-100')
    })

    it('all selects have placeholder option', () => {
      render(<PortalLanding />)

      const placeholders = screen.getAllByText('Bitte auswaehlen...')
      expect(placeholders).toHaveLength(3) // ageRange, gender, familyStatus
    })
  })

  describe('register form submission', () => {
    beforeEach(() => {
      global.fetch = jest.fn()
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('shows loading state during submission', async () => {
      const user = userEvent.setup()
      // Make fetch hang
      ;(global.fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {})
      )

      render(<PortalLanding />)

      // Fill required fields
      await user.selectOptions(screen.getByLabelText('Altersgruppe'), 'ADULT')
      await user.selectOptions(screen.getByLabelText('Geschlecht'), 'MALE')
      await user.selectOptions(screen.getByLabelText('Familienstatus'), 'SINGLE')

      // Submit
      await user.click(screen.getByText('Profil erstellen'))

      expect(screen.getByText('Wird erstellt...')).toBeInTheDocument()
    })

    it('shows success state with code after successful registration', async () => {
      jest.useFakeTimers()
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, code: 'RES-123' }),
      })

      render(<PortalLanding />)

      await user.selectOptions(screen.getByLabelText('Altersgruppe'), 'ADULT')
      await user.selectOptions(screen.getByLabelText('Geschlecht'), 'MALE')
      await user.selectOptions(screen.getByLabelText('Familienstatus'), 'SINGLE')

      await user.click(screen.getByText('Profil erstellen'))

      await waitFor(() => {
        expect(screen.getByText('Profil erstellt! Dein Code ist:')).toBeInTheDocument()
        expect(screen.getByText('RES-123')).toBeInTheDocument()
      })

      jest.useRealTimers()
    })

    it('shows error state on registration failure', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ success: false, error: 'Server error' }),
      })

      render(<PortalLanding />)

      await user.selectOptions(screen.getByLabelText('Altersgruppe'), 'ADULT')
      await user.selectOptions(screen.getByLabelText('Geschlecht'), 'MALE')
      await user.selectOptions(screen.getByLabelText('Familienstatus'), 'SINGLE')

      await user.click(screen.getByText('Profil erstellen'))

      await waitFor(() => {
        expect(screen.getByText('Server error')).toBeInTheDocument()
      })
    })

    it('shows generic error on network failure', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      render(<PortalLanding />)

      await user.selectOptions(screen.getByLabelText('Altersgruppe'), 'ADULT')
      await user.selectOptions(screen.getByLabelText('Geschlecht'), 'MALE')
      await user.selectOptions(screen.getByLabelText('Familienstatus'), 'SINGLE')

      await user.click(screen.getByText('Profil erstellen'))

      await waitFor(() => {
        expect(screen.getByText('Ein Fehler ist aufgetreten.')).toBeInTheDocument()
      })
    })

    it('sends correct data to API', async () => {
      jest.useFakeTimers()
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, code: 'RES-456' }),
      })

      render(<PortalLanding />)

      await user.selectOptions(screen.getByLabelText('Altersgruppe'), 'YOUNG_ADULT')
      await user.selectOptions(screen.getByLabelText('Geschlecht'), 'FEMALE')
      await user.selectOptions(screen.getByLabelText('Familienstatus'), 'SINGLE')

      // Select a language
      await user.click(screen.getByText('Englisch'))

      await user.click(screen.getByText('Profil erstellen'))

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/portal/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ageRange: 'YOUNG_ADULT',
            gender: 'FEMALE',
            familyStatus: 'SINGLE',
            languages: ['EN'],
          }),
        })
      })

      jest.useRealTimers()
    })
  })

  describe('staff link', () => {
    it('renders staff login link', () => {
      render(<PortalLanding />)

      const link = screen.getByText('Mitarbeitende? Zum Mitarbeiter-Login')
      expect(link.closest('a')).toHaveAttribute('href', '/login')
    })
  })
})
