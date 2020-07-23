import { useCallback } from 'react'
import { mocked } from 'ts-jest/utils'
import { Query, QueryCallback, QueryOptions } from 'resolve-client'
import { useClient } from '../src/use-client'
import { useQueryBuilder } from '../src/use-query-builder'

jest.mock('resolve-client')
jest.mock('react', () => ({
  useCallback: jest.fn(cb => cb)
}))
jest.mock('../src/use-client', () => ({
  useClient: jest.fn()
}))

const mockedUseClient = mocked(useClient)
const mockedUseCallback = mocked(useCallback)

const mockedClient = {
  command: jest.fn(),
  query: jest.fn(() => Promise.resolve({ data: 'query-result', timestamp: 1 })),
  getStaticAssetUrl: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn()
}
const buildQuery = jest.fn(
  (user: string): Query => ({
    name: 'model',
    resolver: 'resolver',
    args: {
      user
    }
  })
)
const customOptions = (): QueryOptions => ({
  method: 'GET'
})

const clearMocks = (): void => {
  mockedUseClient.mockClear()
  mockedUseCallback.mockClear()
  mockedClient.query.mockClear()
  buildQuery.mockClear()
}

beforeAll(() => {
  mockedUseClient.mockReturnValue(mockedClient)
})

afterEach(() => {
  clearMocks()
})

describe('common', () => {
  test('useClient hook called', () => {
    useQueryBuilder(buildQuery)

    expect(useClient).toHaveBeenCalled()
  })
})

describe('async mode', () => {
  test('just a builder', async () => {
    await useQueryBuilder(buildQuery)('john')

    expect(buildQuery).toHaveBeenCalledWith('john')
    expect(mockedClient.query).toHaveBeenCalledWith(
      buildQuery('john'),
      undefined,
      undefined
    )
    expect(mockedUseCallback).toHaveBeenCalledWith(expect.any(Function), [
      mockedClient,
      buildQuery
    ])
  })

  test('builder with dependencies', async () => {
    await useQueryBuilder(buildQuery, ['dependency'])('john')

    expect(buildQuery).toHaveBeenCalledWith('john')
    expect(mockedClient.query).toHaveBeenCalledWith(
      buildQuery('john'),
      undefined,
      undefined
    )
    expect(mockedUseCallback).toHaveBeenCalledWith(expect.any(Function), [
      mockedClient,
      'dependency'
    ])
  })

  test('builder and options', async () => {
    const options = customOptions()

    await useQueryBuilder(buildQuery, options)('john')

    expect(buildQuery).toHaveBeenCalledWith('john')
    expect(mockedClient.query).toHaveBeenCalledWith(
      buildQuery('john'),
      options,
      undefined
    )
    expect(mockedUseCallback).toHaveBeenCalledWith(expect.any(Function), [
      mockedClient,
      buildQuery,
      options
    ])
  })

  test('builder, options and dependencies', async () => {
    const options = customOptions()

    await useQueryBuilder(buildQuery, options, ['dependency'])('john')

    expect(buildQuery).toHaveBeenCalledWith('john')
    expect(mockedClient.query).toHaveBeenCalledWith(
      buildQuery('john'),
      options,
      undefined
    )
    expect(mockedUseCallback).toHaveBeenCalledWith(expect.any(Function), [
      mockedClient,
      'dependency'
    ])
  })
})

describe('callback mode', () => {
  let callback: QueryCallback

  beforeEach(() => {
    callback = jest.fn()
  })

  test('just a builder', () => {
    useQueryBuilder(buildQuery, callback)('john')

    expect(buildQuery).toHaveBeenCalledWith('john')
    expect(mockedClient.query).toHaveBeenCalledWith(
      buildQuery('john'),
      undefined,
      callback
    )
    expect(mockedUseCallback).toHaveBeenCalledWith(expect.any(Function), [
      mockedClient,
      buildQuery,
      callback
    ])
  })

  test('builder, callback and dependencies', () => {
    useQueryBuilder(buildQuery, callback, ['dependency'])('john')

    expect(buildQuery).toHaveBeenCalledWith('john')
    expect(mockedClient.query).toHaveBeenCalledWith(
      buildQuery('john'),
      undefined,
      callback
    )
    expect(mockedUseCallback).toHaveBeenCalledWith(expect.any(Function), [
      mockedClient,
      'dependency'
    ])
  })

  test('builder, options and callback', () => {
    const options = customOptions()

    useQueryBuilder(buildQuery, options, callback)('john')

    expect(buildQuery).toHaveBeenCalledWith('john')
    expect(mockedClient.query).toHaveBeenCalledWith(
      buildQuery('john'),
      options,
      callback
    )
    expect(mockedUseCallback).toHaveBeenCalledWith(expect.any(Function), [
      mockedClient,
      buildQuery,
      options,
      callback
    ])
  })

  test('builder, options, callback and dependencies', () => {
    const options = customOptions()

    useQueryBuilder(buildQuery, options, callback, ['dependency'])('john')

    expect(buildQuery).toHaveBeenCalledWith('john')
    expect(mockedClient.query).toHaveBeenCalledWith(
      buildQuery('john'),
      options,
      callback
    )
    expect(mockedUseCallback).toHaveBeenCalledWith(expect.any(Function), [
      mockedClient,
      'dependency'
    ])
  })
})
