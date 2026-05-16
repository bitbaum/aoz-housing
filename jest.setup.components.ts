import '@testing-library/jest-dom'

// useFormStatus is a React 19 / react-dom 19 API. The test environment runs
// React 18 where it does not exist. Stub it so SubmitButton renders without
// throwing; pending is always false, which is the correct idle state for tests.
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  useFormStatus: () => ({ pending: false, data: null, method: null, action: null }),
}))
