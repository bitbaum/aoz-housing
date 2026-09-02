import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// Stub useFormStatus so SubmitButton renders without needing a surrounding
// <form action>; pending is always false, which is the correct idle state for
// tests. (Mocks registered in a setup file apply to every component test.)
vi.mock('react-dom', async () => ({
  ...(await vi.importActual<typeof import('react-dom')>('react-dom')),
  useFormStatus: () => ({ pending: false, data: null, method: null, action: null }),
}))
