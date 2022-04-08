import { renderHook } from '@testing-library/react-hooks'
import { mocked } from 'jest-mock'
import { useClient } from '../src/use-client'
import { useOriginResolver } from '../src/use-origin-resolver'

jest.mock('@resolve-js/client')
jest.mock('../src/use-client', () => ({
  useClient: jest.fn(),
}))

const mockedUseClient = mocked(useClient)

const mockedClient = {
  command: jest.fn(),
  query: jest.fn(),
  getStaticAssetUrl: jest.fn(),
  getOriginPath: jest.fn((asset) => `origin_${asset}`),
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
}

const clearMocks = (): void => {
  mockedUseClient.mockClear()
  mockedClient.getOriginPath.mockClear()
}

beforeAll(() => {
  mockedUseClient.mockReturnValue(mockedClient)
})

afterEach(() => {
  clearMocks()
})

test('useClient hook called', () => {
  renderHook(() => useOriginResolver())

  expect(mockedUseClient).toHaveBeenCalled()
})

test('cached resolver', () => {
  const hookData = renderHook(() => useOriginResolver())
  const resolverA = hookData.result.current
  hookData.rerender()
  expect(hookData.result.current).toBe(resolverA)
})

test('new resolver on underlying client change', () => {
  const hookData = renderHook(() => useOriginResolver())
  const resolverA = hookData.result.current
  mockedUseClient.mockReturnValueOnce({
    ...mockedClient,
  })
  hookData.rerender()
  expect(hookData.result.current).not.toBe(resolverA)
})

describe('resolver tests', () => {
  test('single asset as string', () => {
    const resolver = renderHook(() => useOriginResolver()).result.current

    expect(resolver('command')).toEqual('origin_command')
    expect(mockedClient.getOriginPath).toHaveBeenCalledWith('command')
  })
})
