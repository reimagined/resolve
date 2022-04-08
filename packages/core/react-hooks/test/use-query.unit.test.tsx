import { renderHook } from '@testing-library/react-hooks'
import { mocked } from 'jest-mock'
import { Query, QueryCallback, QueryOptions } from '@resolve-js/client'
import { useClient } from '../src/use-client'
import { useQuery } from '../src/use-query'

jest.mock('@resolve-js/client')
jest.mock('../src/use-client', () => ({
  useClient: jest.fn(),
}))

const mockedUseClient = mocked(useClient)

const mockedClient = {
  command: jest.fn(),
  query: jest.fn(() =>
    Promise.resolve({
      data: 'query-result',
      timestamp: 1,
      url: 'url',
      cursor: 'cursor',
    })
  ),
  getStaticAssetUrl: jest.fn(),
  getOriginPath: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
}
const basicQuery = (): Query => ({
  name: 'model',
  resolver: 'resolver',
  args: {},
})
const customOptions = (): QueryOptions => ({
  method: 'GET',
})
const buildQuery = jest.fn(
  (user: string): Query => ({
    name: 'model',
    resolver: 'resolver',
    args: {
      user,
    },
  })
)

const clearMocks = (): void => {
  mockedUseClient.mockClear()
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
    renderHook(() => useQuery(basicQuery()))
    expect(useClient).toHaveBeenCalled()
  })
})

describe('async mode', () => {
  test('just a query', async () => {
    const query = basicQuery()

    const {
      result: { current: execute },
    } = renderHook(() => useQuery(query))

    await execute()

    expect(mockedClient.query).toHaveBeenCalledWith(query, undefined, undefined)
  })

  test('cached query executor with custom dependencies', async () => {
    const query = basicQuery()
    const dependency = 'dependency'

    const hookData = renderHook(
      (props) => useQuery(query, props.dependencies),
      {
        initialProps: {
          dependencies: [dependency],
        },
      }
    )
    const executeA = hookData.result.current
    hookData.rerender({
      dependencies: [dependency],
    })

    expect(hookData.result.current).toBe(executeA)
  })

  test('new query executor on underlying client change', async () => {
    const query = basicQuery()
    const dependency = 'dependency'

    const hookData = renderHook(
      (props) => useQuery(query, props.dependencies),
      {
        initialProps: {
          dependencies: [dependency],
        },
      }
    )
    const executeA = hookData.result.current
    mockedUseClient.mockReturnValueOnce({
      ...mockedClient,
    })
    hookData.rerender({
      dependencies: [dependency],
    })

    expect(hookData.result.current).not.toBe(executeA)
  })

  test('new query executor on dependencies change', async () => {
    const query = basicQuery()
    const dependency = 'dependency'

    const hookData = renderHook(
      (props) => useQuery(query, props.dependencies),
      {
        initialProps: {
          dependencies: [dependency],
        },
      }
    )
    const executeA = hookData.result.current
    hookData.rerender({
      dependencies: ['changed'],
    })

    expect(hookData.result.current).not.toBe(executeA)
  })

  test('query and options', async () => {
    const query = basicQuery()
    const options = customOptions()

    const {
      result: { current: execute },
    } = renderHook(() => useQuery(query, options))

    await execute()

    expect(mockedClient.query).toHaveBeenCalledWith(query, options, undefined)
  })

  test('cached query executor with custom dependencies (with options)', async () => {
    const query = basicQuery()
    const dependency = 'dependency'

    const hookData = renderHook(
      (props) => useQuery(query, customOptions(), props.dependencies),
      {
        initialProps: {
          dependencies: [dependency],
        },
      }
    )
    const executeA = hookData.result.current
    hookData.rerender({
      dependencies: [dependency],
    })

    expect(hookData.result.current).toBe(executeA)
  })

  test('new query executor on dependencies change (with options)', async () => {
    const query = basicQuery()
    const dependency = 'dependency'

    const hookData = renderHook(
      (props) => useQuery(query, customOptions(), props.dependencies),
      {
        initialProps: {
          dependencies: [dependency],
        },
      }
    )
    const executeA = hookData.result.current
    hookData.rerender({
      dependencies: ['changed'],
    })

    expect(hookData.result.current).not.toBe(executeA)
  })
})

describe('callback mode', () => {
  let callback: QueryCallback<Query>

  beforeEach(() => {
    callback = jest.fn()
  })

  test('just a query', () => {
    const query = basicQuery()

    const {
      result: { current: execute },
    } = renderHook(() => useQuery(query, callback))

    execute()

    expect(mockedClient.query).toHaveBeenCalledWith(query, undefined, callback)
  })

  test('cached query executor with custom dependencies', () => {
    const query = basicQuery()
    const dependency = 'dependency'

    const hookData = renderHook(
      (props) => useQuery(query, callback, props.dependencies),
      {
        initialProps: {
          dependencies: [dependency],
        },
      }
    )
    const executeA = hookData.result.current
    hookData.rerender({
      dependencies: [dependency],
    })

    expect(hookData.result.current).toBe(executeA)
  })

  test('new query executor on underlying client change', async () => {
    const query = basicQuery()
    const dependency = 'dependency'

    const hookData = renderHook(
      (props) => useQuery(query, callback, props.dependencies),
      {
        initialProps: {
          dependencies: [dependency],
        },
      }
    )
    const executeA = hookData.result.current
    mockedUseClient.mockReturnValueOnce({
      ...mockedClient,
    })
    hookData.rerender({
      dependencies: [dependency],
    })

    expect(hookData.result.current).not.toBe(executeA)
  })

  test('new query executor on dependencies change', async () => {
    const query = basicQuery()
    const dependency = 'dependency'

    const hookData = renderHook(
      (props) => useQuery(query, callback, props.dependencies),
      {
        initialProps: {
          dependencies: [dependency],
        },
      }
    )
    const executeA = hookData.result.current
    hookData.rerender({
      dependencies: ['changed'],
    })

    expect(hookData.result.current).not.toBe(executeA)
  })

  test('query, options and callback', () => {
    const query = basicQuery()
    const options = customOptions()

    const {
      result: { current: execute },
    } = renderHook(() => useQuery(query, options, callback))

    execute()

    expect(mockedClient.query).toHaveBeenCalledWith(query, options, callback)
  })

  test('cached query executor with custom dependencies (with options)', async () => {
    const query = basicQuery()
    const dependency = 'dependency'

    const hookData = renderHook(
      (props) => useQuery(query, customOptions(), callback, props.dependencies),
      {
        initialProps: {
          dependencies: [dependency],
        },
      }
    )
    const executeA = hookData.result.current
    hookData.rerender({
      dependencies: [dependency],
    })

    expect(hookData.result.current).toBe(executeA)
  })

  test('new query executor on dependencies change (with options)', async () => {
    const query = basicQuery()
    const dependency = 'dependency'

    const hookData = renderHook(
      (props) => useQuery(query, customOptions(), callback, props.dependencies),
      {
        initialProps: {
          dependencies: [dependency],
        },
      }
    )
    const executeA = hookData.result.current
    hookData.rerender({
      dependencies: ['changed'],
    })

    expect(hookData.result.current).not.toBe(executeA)
  })
})

describe('builder: async mode', () => {
  test('just a builder', async () => {
    const {
      result: { current: execute },
    } = renderHook(() => useQuery(buildQuery))

    await execute('builder-input')

    expect(buildQuery).toHaveBeenCalledWith('builder-input')
    expect(mockedClient.query).toHaveBeenCalledWith(
      buildQuery('builder-input'),
      undefined,
      undefined
    )
  })

  test('new query executor on re-render without dependencies', () => {
    const hookData = renderHook(() => useQuery(buildQuery))
    const executeA = hookData.result.current

    hookData.rerender()
    expect(hookData.result.current).not.toBe(executeA)
  })

  test('cached query executor with custom dependencies', () => {
    const dependency = 'dependency'

    const hookData = renderHook(
      (props) => useQuery(buildQuery, props.dependencies),
      {
        initialProps: {
          dependencies: [dependency],
        },
      }
    )
    const executeA = hookData.result.current
    hookData.rerender({
      dependencies: [dependency],
    })

    expect(hookData.result.current).toBe(executeA)
  })

  test('new query executor with custom dependencies but changed underlying client', () => {
    const dependency = 'dependency'

    const hookData = renderHook(
      (props) => useQuery(buildQuery, props.dependencies),
      {
        initialProps: {
          dependencies: [dependency],
        },
      }
    )
    const executeA = hookData.result.current
    mockedUseClient.mockReturnValueOnce({
      ...mockedClient,
    })
    hookData.rerender({
      dependencies: [dependency],
    })

    expect(hookData.result.current).not.toBe(executeA)
  })

  test('builder and options', async () => {
    const options = customOptions()

    const {
      result: { current: execute },
    } = renderHook(() => useQuery(buildQuery, options))

    await execute('builder-input')

    expect(buildQuery).toHaveBeenCalledWith('builder-input')
    expect(mockedClient.query).toHaveBeenCalledWith(
      buildQuery('builder-input'),
      options,
      undefined
    )
  })

  test('cached command executor with custom dependencies (with options)', () => {
    const dependency = 'dependency'

    const hookData = renderHook(
      (props) => useQuery(buildQuery, customOptions(), props.dependencies),
      {
        initialProps: {
          dependencies: [dependency],
        },
      }
    )
    const executeA = hookData.result.current
    hookData.rerender({
      dependencies: [dependency],
    })

    expect(hookData.result.current).toBe(executeA)
  })

  test('new command executor on dependencies change (with options)', async () => {
    const dependency = 'dependency'

    const hookData = renderHook(
      (props) => useQuery(buildQuery, customOptions(), props.dependencies),
      {
        initialProps: {
          dependencies: [dependency],
        },
      }
    )
    const executeA = hookData.result.current
    hookData.rerender({
      dependencies: ['changed'],
    })

    expect(hookData.result.current).not.toBe(executeA)
  })
})

describe('builder: callback mode', () => {
  let callback: QueryCallback<Query>

  beforeEach(() => {
    callback = jest.fn()
  })

  test('just a builder', () => {
    const {
      result: { current: execute },
    } = renderHook(() => useQuery(buildQuery, callback))

    execute('builder-input')

    expect(buildQuery).toHaveBeenCalledWith('builder-input')
    expect(mockedClient.query).toHaveBeenCalledWith(
      buildQuery('builder-input'),
      undefined,
      callback
    )
  })

  test('new query executor on re-render without dependencies', () => {
    const hookData = renderHook(() => useQuery(buildQuery, callback))
    const executeA = hookData.result.current

    hookData.rerender()
    expect(hookData.result.current).not.toBe(executeA)
  })

  test('cached query executor with custom dependencies', () => {
    const dependency = 'dependency'

    const hookData = renderHook(
      (props) => useQuery(buildQuery, callback, props.dependencies),
      {
        initialProps: {
          dependencies: [dependency],
        },
      }
    )
    const executeA = hookData.result.current
    hookData.rerender({
      dependencies: [dependency],
    })

    expect(hookData.result.current).toBe(executeA)
  })

  test('new query executor with custom dependencies but changed underlying client', () => {
    const dependency = 'dependency'

    const hookData = renderHook(
      (props) => useQuery(buildQuery, callback, props.dependencies),
      {
        initialProps: {
          dependencies: [dependency],
        },
      }
    )
    const executeA = hookData.result.current
    mockedUseClient.mockReturnValueOnce({
      ...mockedClient,
    })
    hookData.rerender({
      dependencies: [dependency],
    })

    expect(hookData.result.current).not.toBe(executeA)
  })

  test('builder and options', () => {
    const options = customOptions()

    const {
      result: { current: execute },
    } = renderHook(() => useQuery(buildQuery, options, callback))

    execute('builder-input')

    expect(buildQuery).toHaveBeenCalledWith('builder-input')
    expect(mockedClient.query).toHaveBeenCalledWith(
      buildQuery('builder-input'),
      options,
      callback
    )
  })

  test('cached command executor with custom dependencies (with options)', () => {
    const dependency = 'dependency'

    const hookData = renderHook(
      (props) =>
        useQuery(buildQuery, customOptions(), callback, props.dependencies),
      {
        initialProps: {
          dependencies: [dependency],
        },
      }
    )
    const executeA = hookData.result.current
    hookData.rerender({
      dependencies: [dependency],
    })

    expect(hookData.result.current).toBe(executeA)
  })

  test('new command executor on dependencies change (with options)', () => {
    const dependency = 'dependency'

    const hookData = renderHook(
      (props) =>
        useQuery(buildQuery, customOptions(), callback, props.dependencies),
      {
        initialProps: {
          dependencies: [dependency],
        },
      }
    )
    const executeA = hookData.result.current
    hookData.rerender({
      dependencies: ['changed'],
    })

    expect(hookData.result.current).not.toBe(executeA)
  })
})
