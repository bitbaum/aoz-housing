import '@testing-library/jest-dom/vitest'

// useFormStatus is a React 19 / react-dom 19 API. The test environment runs
// React 18 where it does not exist. Stub it so SubmitButton renders without
// throwing; pending is always false, which is the correct idle state for tests.
// async: vitest's importActual is async, unlike jest's requireActual,
// so the factory has to await it.
vi.mock('react-dom', async () => ({
  ...(await vi.importActual<Record<string, unknown>>('react-dom')),
  useFormStatus: () => ({ pending: false, data: null, method: null, action: null }),
}))
