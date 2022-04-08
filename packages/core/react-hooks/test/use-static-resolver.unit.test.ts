import { renderHook } from '@testing-library/react-hooks'
import { mocked } from 'jest-mock'
import { useClient } from '../src/use-client'
import { useStaticResolver } from '../src/use-static-resolver'

jest.mock('@resolve-js/client')
jest.mock('../src/use-client', () => ({
  useClient: jest.fn(),
}))

const mockedUseClient = mocked(useClient)

const mockedClient = {
  command: jest.fn(),
  query: jest.fn(),
  getStaticAssetUrl: jest.fn((asset) => `static_${asset}`),
  getOriginPath: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
}

const clearMocks = (): void => {
  mockedUseClient.mockClear()
  mockedClient.getStaticAssetUrl.mockClear()
}

beforeAll(() => {
  mockedUseClient.mockReturnValue(mockedClient)
})

afterEach(() => {
  clearMocks()
})

test('useClient hook called', () => {
  renderHook(() => useStaticResolver())

  expect(mockedUseClient).toHaveBeenCalled()
})

test('cached resolver', () => {
  const hookData = renderHook(() => useStaticResolver())
  const resolverA = hookData.result.current
  hookData.rerender()
  expect(hookData.result.current).toBe(resolverA)
})

test('new resolver on underlying client change', () => {
  const hookData = renderHook(() => useStaticResolver())
  const resolverA = hookData.result.current
  mockedUseClient.mockReturnValueOnce({
    ...mockedClient,
  })
  hookData.rerender()
  expect(hookData.result.current).not.toBe(resolverA)
})

describe('resolver tests', () => {
  test('single asset as string', () => {
    const resolver = renderHook(() => useStaticResolver()).result.current

    expect(resolver('asset')).toEqual('static_asset')
    expect(mockedClient.getStaticAssetUrl).toHaveBeenCalledWith('asset')
  })
})
