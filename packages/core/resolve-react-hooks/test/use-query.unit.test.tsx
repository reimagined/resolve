import { useCallback } from 'react'
import { mocked } from 'ts-jest/utils'
import { Query, QueryCallback, QueryOptions } from 'resolve-client'
import { useClient } from '../src/use-client'
import { useQuery } from '../src/use-query'

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
const basicQuery = (): Query => ({
  name: 'model',
  resolver: 'resolver',
  args: {}
})
const customOptions = (): QueryOptions => ({
  method: 'GET'
})
const buildQuery = jest.fn(
  (user: string): Query => ({
    name: 'model',
    resolver: 'resolver',
    args: {
      user
    }
  })
)

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
    useQuery(basicQuery())

    expect(useClient).toHaveBeenCalled()
  })
})

describe('async mode', () => {
  test('just a query', async () => {
    const query = basicQuery()

    await useQuery(query)()

    expect(mockedClient.query).toHaveBeenCalledWith(query, undefined, undefined)
    expect(mockedUseCallback).toHaveBeenCalledWith(expect.any(Function), [
      mockedClient,
      query
    ])
  })

  test('query and dependencies', async () => {
    const query = basicQuery()

    await useQuery(query, ['dependency'])()

    expect(mockedClient.query).toHaveBeenCalledWith(query, undefined, undefined)
    expect(mockedUseCallback).toHaveBeenCalledWith(expect.any(Function), [
      mockedClient,
      'dependency'
    ])
  })

  test('query and options', async () => {
    const query = basicQuery()
    const options = customOptions()

    await useQuery(query, options)()

    expect(mockedClient.query).toHaveBeenCalledWith(query, options, undefined)
    expect(mockedUseCallback).toHaveBeenCalledWith(expect.any(Function), [
      mockedClient,
      query,
      options
    ])
  })

  test('query, options and dependencies', async () => {
    const query = basicQuery()
    const options = customOptions()

    await useQuery(query, options, ['dependency'])()

    expect(mockedClient.query).toHaveBeenCalledWith(query, options, undefined)
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

  test('just a query', () => {
    const query = basicQuery()

    useQuery(query, callback)()

    expect(mockedClient.query).toHaveBeenCalledWith(query, undefined, callback)
    expect(mockedUseCallback).toHaveBeenCalledWith(expect.any(Function), [
      mockedClient,
      query,
      callback
    ])
  })

  test('query, callback and dependencies', () => {
    const query = basicQuery()

    useQuery(query, callback, ['dependency'])()

    expect(mockedClient.query).toHaveBeenCalledWith(query, undefined, callback)
    expect(mockedUseCallback).toHaveBeenCalledWith(expect.any(Function), [
      mockedClient,
      'dependency'
    ])
  })

  test('query, options and callback', () => {
    const query = basicQuery()
    const options = customOptions()

    useQuery(query, options, callback)()

    expect(mockedClient.query).toHaveBeenCalledWith(query, options, callback)
    expect(mockedUseCallback).toHaveBeenCalledWith(expect.any(Function), [
      mockedClient,
      query,
      options,
      callback
    ])
  })

  test('query, options, callback and dependencies', () => {
    const query = basicQuery()
    const options = customOptions()

    useQuery(query, options, callback, ['dependency'])()

    expect(mockedClient.query).toHaveBeenCalledWith(query, options, callback)
    expect(mockedUseCallback).toHaveBeenCalledWith(expect.any(Function), [
      mockedClient,
      'dependency'
    ])
  })
})

describe('builder: async mode', () => {
  test('just a builder', async () => {
    await useQuery(buildQuery)('john')

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
    await useQuery(buildQuery, ['dependency'])('john')

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

    await useQuery(buildQuery, options)('john')

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

    await useQuery(buildQuery, options, ['dependency'])('john')

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

describe('builder: callback mode', () => {
  let callback: QueryCallback

  beforeEach(() => {
    callback = jest.fn()
  })

  test('just a builder', () => {
    useQuery(buildQuery, callback)('john')

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
    useQuery(buildQuery, callback, ['dependency'])('john')

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

    useQuery(buildQuery, options, callback)('john')

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

    useQuery(buildQuery, options, callback, ['dependency'])('john')

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
