import type { Mock } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, waitFor } from '@testing-library/react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { AdminUrlFeedback } from '../AdminUrlFeedback'
import { showToast } from '@/components/ui/Toast'
import { RESIDENT_DETAIL_LABELS } from '@/lib/constants/labels/ui'

vi.mock('next/navigation', async () => ({
  useSearchParams: vi.fn(),
  useRouter: vi.fn(),
  usePathname: vi.fn(),
}))

vi.mock('@/components/ui/Toast', async () => ({
  showToast: vi.fn(),
}))

const mockReplace = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  ;(useRouter as Mock).mockReturnValue({ replace: mockReplace })
})

describe('AdminUrlFeedback', () => {
  it('shows placement toast on resident detail URL', async () => {
    ;(usePathname as Mock).mockReturnValue('/residents/abc123')
    ;(useSearchParams as Mock).mockReturnValue(new URLSearchParams('placed=true'))

    render(<AdminUrlFeedback />)

    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith('success', RESIDENT_DETAIL_LABELS.toastPlaced)
      expect(mockReplace).toHaveBeenCalledWith('/residents/abc123', { scroll: false })
    })
  })
})
