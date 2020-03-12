import { useContext, useCallback, useMemo } from 'react'
import { mocked } from 'ts-jest/utils'
import { getClient } from 'resolve-client'
import { StaticResolver, useStaticResolver } from '../src/use_static_resolver'

jest.mock('resolve-client')
jest.mock('react', () => ({
  useContext: jest.fn(() => 'mocked-context'),
  useCallback: jest.fn(cb => cb),
  useMemo: jest.fn(evaluate => evaluate())
}))
jest.mock('../src/context', () => ({
  ResolveContext: 'mocked-context-selector'
}))

const mockedGetClient = mocked(getClient)
const mockedUseContext = mocked(useContext)
const mockedUseCallback = mocked(useCallback)
const mockedUseMemo = mocked(useMemo)

const mockedClient = {
  command: jest.fn(),
  query: jest.fn(),
  getStaticAssetUrl: jest.fn(asset => `static_${asset}`),
  subscribeTo: jest.fn(),
  unsubscribe: jest.fn()
}

const clearMocks = (): void => {
  mockedGetClient.mockClear()

  mockedUseContext.mockClear()
  mockedUseCallback.mockClear()
  mockedUseMemo.mockClear()

  mockedClient.getStaticAssetUrl.mockClear()
}

beforeAll(() => {
  mockedGetClient.mockReturnValue(mockedClient)
})

afterEach(() => {
  clearMocks()
})

test('client obtained for provided context and cached', () => {
  useStaticResolver()

  expect(mockedUseContext).toHaveBeenCalledWith('mocked-context-selector')
  expect(mockedUseMemo).toHaveBeenCalledWith(expect.any(Function), [
    'mocked-context'
  ])
  expect(getClient).toHaveBeenCalledWith('mocked-context')

  const clientMemo = mockedUseMemo.mock.calls[0][0]
  expect(clientMemo()).toEqual(mockedClient)
})

test('cached resolver returned', () => {
  const resolver = useStaticResolver()

  expect(resolver).toBeInstanceOf(Function)
  expect(mockedUseCallback).toHaveBeenCalledWith(resolver, [mockedClient])
})

describe('resolver tests', () => {
  let resolver: StaticResolver

  beforeEach(() => {
    resolver = useStaticResolver()
  })

  test('single asset as string', () => {
    expect(resolver('asset')).toEqual('static_asset')
    expect(mockedClient.getStaticAssetUrl).toHaveBeenCalledWith('asset')
  })

  test('single asset as array', () => {
    expect(resolver(['asset'])).toEqual(['static_asset'])
    expect(mockedClient.getStaticAssetUrl).toHaveBeenCalledWith('asset')
  })

  test('multiple assets as array', () => {
    expect(resolver(['image', 'icon'])).toEqual(['static_image', 'static_icon'])
    expect(mockedClient.getStaticAssetUrl).toHaveBeenCalledWith('image')
    expect(mockedClient.getStaticAssetUrl).toHaveBeenCalledWith('icon')
  })
})
