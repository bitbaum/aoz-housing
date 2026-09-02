import type { Mock } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, waitFor } from '@testing-library/react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { UrlFeedbackToast } from '../UrlFeedbackToast'
import { showToast } from '../Toast'

vi.mock('next/navigation', async () => ({
  useSearchParams: vi.fn(),
  useRouter: vi.fn(),
  usePathname: vi.fn(),
}))

vi.mock('../Toast', async () => ({
  showToast: vi.fn(),
}))

const mockReplace = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  ;(useRouter as Mock).mockReturnValue({ replace: mockReplace })
  ;(usePathname as Mock).mockReturnValue('/portal')
})

describe('UrlFeedbackToast', () => {
  it('shows error toast and strips error param', async () => {
    ;(useSearchParams as Mock).mockReturnValue(new URLSearchParams('error=account_not_found'))

    render(
      <UrlFeedbackToast
        errors={[{ code: 'account_not_found', message: 'Konto nicht gefunden' }]}
      />,
    )

    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith('error', 'Konto nicht gefunden')
      expect(mockReplace).toHaveBeenCalledWith('/portal', { scroll: false })
    })
  })

  it('shows success toast and strips param', async () => {
    ;(useSearchParams as Mock).mockReturnValue(new URLSearchParams('created=true'))

    render(<UrlFeedbackToast success={[{ param: 'created', message: 'Gespeichert' }]} />)

    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith('success', 'Gespeichert')
      expect(mockReplace).toHaveBeenCalledWith('/portal', { scroll: false })
    })
  })
})
