import { useContext, useCallback, useMemo } from 'react'
import { mocked } from 'ts-jest/utils'
import { useClient } from '../src/use_client'
import { useViewModel } from '../src/use_view_model'

const mockedContext = {
  viewModels: [
    {
      name: 'view-model-name',
      projection: [],
      deserializeState: (): object => ({})
    },
    {
      name: 'another-view-model-name',
      projection: [],
      deserializeState: (): object => ({})
    }
  ]
}

jest.mock('resolve-client')
jest.mock('react', () => ({
  useContext: jest.fn(() => mockedContext),
  useCallback: jest.fn(cb => cb),
  useMemo: jest.fn(evaluate => evaluate())
}))
jest.mock('../src/context', () => ({
  ResolveContext: 'mocked-context-selector'
}))

const mockedClient = {
  command: jest.fn(),
  query: jest.fn(() => Promise.resolve({ data: 'query-result', timestamp: 1 })),
  getStaticAssetUrl: jest.fn(),
  subscribe: jest.fn().mockResolvedValue({ key: 'subscription-data' }),
  unsubscribe: jest.fn()
}

jest.mock('../src/use_client', () => ({
  useClient: jest.fn(() => mockedClient)
}))

const mockedUseContext = mocked(useContext)
const mockedUseCallback = mocked(useCallback)
const mockedUseMemo = mocked(useMemo)

const mockedUseClient = mocked(useClient)

const mockStateChange = jest.fn()

const clearMocks = (): void => {
  mockedUseClient.mockClear()

  mockedUseContext.mockClear()
  mockedUseCallback.mockClear()
  mockedUseMemo.mockClear()

  mockedClient.query.mockClear()
  mockedClient.subscribe.mockClear()
  mockedClient.unsubscribe.mockClear()

  mockStateChange.mockClear()
}

beforeAll(() => {
  mockedUseClient.mockReturnValue(mockedClient)
})

afterEach(() => {
  clearMocks()
})

describe('common', () => {
  test('client requested for specified context', () => {
    useViewModel('view-model-name', ['aggregate-id'], mockStateChange)

    expect(mockedUseContext).toHaveBeenCalledWith('mocked-context-selector')
    expect(useClient).toHaveBeenCalledTimes(1)
  })

  test('returns functions', () => {
    const { connect, dispose } = useViewModel(
      'view-model-name',
      ['aggregate-id'],
      mockStateChange
    )

    expect(connect).toBeInstanceOf(Function)
    expect(dispose).toBeInstanceOf(Function)
  })

  test('fail if no context found', () => {
    mockedUseContext.mockReturnValueOnce(null)

    expect(() =>
      useViewModel('view-model-name', ['aggregate-id'], mockStateChange)
    ).toThrow()
  })
})

describe('call', () => {
  test('connect as promise', async () => {
    const { connect } = useViewModel(
      'view-model-name',
      ['aggregate-id'],
      mockStateChange
    )

    await connect()

    expect(mockedClient.query).toBeCalledWith(
      {
        aggregateIds: ['aggregate-id'],
        args: {},
        name: 'view-model-name'
      },
      undefined
    )

    expect(mockedClient.subscribe).toBeCalledWith(
      'view-model-name',
      ['aggregate-id'],
      expect.any(Function),
      undefined,
      expect.any(Function)
    )
  })

  test('connect as promise with query options', async () => {
    const validator = (): boolean => true
    const { connect } = useViewModel(
      'view-model-name',
      ['aggregate-id'],
      mockStateChange,
      {
        method: 'POST',
        waitFor: {
          validator
        }
      }
    )

    await connect()
    expect(mockedClient.query).toBeCalledWith(
      {
        aggregateIds: ['aggregate-id'],
        args: {},
        name: 'view-model-name'
      },
      {
        method: 'POST',
        waitFor: {
          validator
        }
      }
    )
    expect(mockedClient.subscribe).toBeCalledWith(
      'view-model-name',
      ['aggregate-id'],
      expect.any(Function),
      undefined,
      expect.any(Function)
    )
  })

  test('dispose as promise', async () => {
    const { connect, dispose } = useViewModel(
      'view-model-name',
      ['aggregate-id'],
      mockStateChange
    )
    await connect()
    await dispose()

    expect(mockedClient.unsubscribe).toBeCalledWith({
      key: 'subscription-data'
    })
  })

  test('connect with callback', done => {
    const { connect } = useViewModel(
      'view-model-name',
      ['aggregate-id'],
      mockStateChange
    )

    const callback = jest.fn(done)
    const result = connect(callback)
    expect(result).toBeUndefined()
  })

  test('dispose with callback', async () => {
    const { connect, dispose } = useViewModel(
      'view-model-name',
      ['aggregate-id'],
      mockStateChange
    )
    const callback = jest.fn(() => {
      /* no op */
    })

    await connect(jest.fn())

    const result = await dispose(callback)
    expect(result).toBeUndefined()
    expect(callback).toHaveBeenCalledTimes(1)
  })
})
