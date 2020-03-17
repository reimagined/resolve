import { useCallback } from 'react'
import { mocked } from 'ts-jest/utils'
import { useClient } from '../src/use_client'
import { StaticResolver, useStaticResolver } from '../src/use_static_resolver'

jest.mock('resolve-client')
jest.mock('react', () => ({
  useCallback: jest.fn(cb => cb)
}))
jest.mock('../src/use_client', () => ({
  useClient: jest.fn()
}))

const mockedUseClient = mocked(useClient)
const mockedUseCallback = mocked(useCallback)

const mockedClient = {
  command: jest.fn(),
  query: jest.fn(),
  getStaticAssetUrl: jest.fn(asset => `static_${asset}`),
  subscribeTo: jest.fn(),
  unsubscribe: jest.fn()
}

const clearMocks = (): void => {
  mockedUseClient.mockClear()

  mockedUseCallback.mockClear()

  mockedClient.getStaticAssetUrl.mockClear()
}

beforeAll(() => {
  mockedUseClient.mockReturnValue(mockedClient)
})

afterEach(() => {
  clearMocks()
})

test('useClient hook called', () => {
  useStaticResolver()

  expect(mockedUseClient).toHaveBeenCalled()
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
