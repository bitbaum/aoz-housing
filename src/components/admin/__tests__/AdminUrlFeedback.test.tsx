import '@testing-library/jest-dom'
import { render, waitFor } from '@testing-library/react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { AdminUrlFeedback } from '../AdminUrlFeedback'
import { showToast } from '@/components/ui/Toast'
import { RESIDENT_DETAIL_LABELS } from '@/lib/constants/labels/ui'

jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}))

jest.mock('@/components/ui/Toast', () => ({
  showToast: jest.fn(),
}))

const mockReplace = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  ;(useRouter as jest.Mock).mockReturnValue({ replace: mockReplace })
})

describe('AdminUrlFeedback', () => {
  it('shows placement toast on resident detail URL', async () => {
    ;(usePathname as jest.Mock).mockReturnValue('/residents/abc123')
    ;(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('placed=true'))

    render(<AdminUrlFeedback />)

    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith('success', RESIDENT_DETAIL_LABELS.toastPlaced)
      expect(mockReplace).toHaveBeenCalledWith('/residents/abc123', { scroll: false })
    })
  })
})
