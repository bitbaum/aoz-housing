import '@testing-library/jest-dom'
import { render, waitFor } from '@testing-library/react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { UrlFeedbackToast } from '../UrlFeedbackToast'
import { showToast } from '../Toast'

jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}))

jest.mock('../Toast', () => ({
  showToast: jest.fn(),
}))

const mockReplace = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  ;(useRouter as jest.Mock).mockReturnValue({ replace: mockReplace })
  ;(usePathname as jest.Mock).mockReturnValue('/portal')
})

describe('UrlFeedbackToast', () => {
  it('shows error toast and strips error param', async () => {
    ;(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('error=account_not_found'))

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
    ;(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('created=true'))

    render(<UrlFeedbackToast success={[{ param: 'created', message: 'Gespeichert' }]} />)

    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith('success', 'Gespeichert')
      expect(mockReplace).toHaveBeenCalledWith('/portal', { scroll: false })
    })
  })
})
