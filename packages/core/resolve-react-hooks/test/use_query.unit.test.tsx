import { useContext, useCallback } from 'react'
import { mocked } from 'ts-jest/utils'
import { Query, QueryCallback, getClient, QueryOptions } from 'resolve-client'
import { useQuery } from '../src/use_query'

jest.mock('resolve-client')
jest.mock('react', () => ({
  useContext: jest.fn(() => 'mocked-context'),
  useCallback: jest.fn(cb => cb)
}))
jest.mock('../src/context', () => ({
  ResolveContext: 'mocked-context-selector'
}))

const mockedGetClient = mocked(getClient)
const mockedUseContext = mocked(useContext)
const mockedUseCallback = mocked(useCallback)

const mockedClient = {
  command: jest.fn(),
  query: jest.fn(() => Promise.resolve({ data: 'query-result', timestamp: 1 })),
  getStaticAssetUrl: jest.fn(),
  subscribeTo: jest.fn(),
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

const clearMocks = (): void => {
  mockedGetClient.mockClear()

  mockedUseContext.mockClear()
  mockedUseCallback.mockClear()

  mockedClient.command.mockClear()
}

beforeAll(() => {
  mockedGetClient.mockReturnValue(mockedClient)
})

afterEach(() => {
  clearMocks()
})

describe('common', () => {
  test('client requested for specified context', () => {
    useQuery(basicQuery())

    expect(mockedUseContext).toHaveBeenCalledWith('mocked-context-selector')
    expect(getClient).toHaveBeenCalledWith('mocked-context')
  })

  test('fail if not context found', () => {
    mockedUseContext.mockReturnValueOnce(null)

    expect(() => useQuery(basicQuery())).toThrow()
    expect(mockedGetClient).not.toHaveBeenCalled()
  })
})

describe('async mode', () => {
  test('just a query', async () => {
    const query = basicQuery()

    await useQuery(query)()

    expect(mockedClient.query).toHaveBeenCalledWith(query, undefined, undefined)
    expect(mockedUseCallback).toHaveBeenCalledWith(expect.any(Function), [
      'mocked-context',
      query
    ])
  })

  test('query and dependencies', async () => {
    const query = basicQuery()

    await useQuery(query, ['dependency'])()

    expect(mockedClient.query).toHaveBeenCalledWith(query, undefined, undefined)
    expect(mockedUseCallback).toHaveBeenCalledWith(expect.any(Function), [
      'mocked-context',
      'dependency'
    ])
  })

  test('query and options', async () => {
    const query = basicQuery()
    const options = customOptions()

    await useQuery(query, options)()

    expect(mockedClient.query).toHaveBeenCalledWith(query, options, undefined)
    expect(mockedUseCallback).toHaveBeenCalledWith(expect.any(Function), [
      'mocked-context',
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
      'mocked-context',
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
      'mocked-context',
      query,
      callback
    ])
  })

  test('query, callback and dependencies', () => {
    const query = basicQuery()

    useQuery(query, callback, ['dependency'])()

    expect(mockedClient.query).toHaveBeenCalledWith(query, undefined, callback)
    expect(mockedUseCallback).toHaveBeenCalledWith(expect.any(Function), [
      'mocked-context',
      'dependency'
    ])
  })

  test('query, options and callback', () => {
    const query = basicQuery()
    const options = customOptions()

    useQuery(query, options, callback)()

    expect(mockedClient.query).toHaveBeenCalledWith(query, options, callback)
    expect(mockedUseCallback).toHaveBeenCalledWith(expect.any(Function), [
      'mocked-context',
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
      'mocked-context',
      'dependency'
    ])
  })
})
