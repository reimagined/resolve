import { useContext, useCallback, useMemo } from 'react'
import { mocked } from 'ts-jest/utils'
import { useClient } from '../src/use-client'
import { useViewModel } from '../src/use-view-model'

const projectionInitHandler = jest.fn()
const mockedContext = {
  viewModels: [
    {
      name: 'view-model-name',
      projection: {
        Init: projectionInitHandler,
        EVENT_TYPE: (state: any, event: any) => ({
          ...state,
          appliedEvent: event
        })
      },
      deserializeState: (): object => ({})
    },
    {
      name: 'another-view-model-name',
      projection: {},
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
  query: jest.fn(() =>
    Promise.resolve({
      data: {
        queried: 'result'
      },
      timestamp: 1,
      url: 'url',
      cursor: 'cursor'
    })
  ),
  getStaticAssetUrl: jest.fn(),
  subscribe: jest.fn().mockResolvedValue({ key: 'subscription-data' }),
  unsubscribe: jest.fn()
}

jest.mock('../src/use-client', () => ({
  useClient: jest.fn(() => mockedClient)
}))

const mockedUseContext = mocked(useContext)
const mockedUseCallback = mocked(useCallback)
const mockedUseMemo = mocked(useMemo)

const mockedUseClient = mocked(useClient)

const mockStateChange = jest.fn()
const mockEventReceived = jest.fn()

const clearMocks = (): void => {
  mockedUseClient.mockClear()

  mockedUseContext.mockClear()
  mockedUseCallback.mockClear()
  mockedUseMemo.mockClear()

  mockedClient.query.mockClear()
  mockedClient.subscribe.mockClear()
  mockedClient.unsubscribe.mockClear()

  mockStateChange.mockClear()
  mockEventReceived.mockClear()

  projectionInitHandler.mockClear()
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
  const emulateIncomingEvent = async (event: any) => {
    const subscriptionEventHandler = mockedClient.subscribe.mock.calls[0][4]
    await subscriptionEventHandler(event)
  }

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
      'url',
      'cursor',
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
      'url',
      'cursor',
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

  test('projection Init handler invoked during initialization', () => {
    useViewModel('view-model-name', ['aggregate-id'], mockStateChange)

    expect(projectionInitHandler).toHaveBeenCalled()
  })

  test('state changed callback invoked on connect with initial queried state', async () => {
    const { connect } = useViewModel(
      'view-model-name',
      ['aggregate-id'],
      mockStateChange
    )

    await connect()

    expect(mockStateChange).toHaveBeenCalledWith({
      queried: 'result'
    })
  })

  test('state changed callback invoked with updated state', async () => {
    const event = {
      type: 'EVENT_TYPE'
    }
    const { connect } = useViewModel(
      'view-model-name',
      ['aggregate-id'],
      mockStateChange
    )

    await connect()

    await emulateIncomingEvent(event)

    expect(mockStateChange).toHaveBeenCalledWith({
      queried: 'result',
      appliedEvent: event
    })
  })

  test('event received callback invoked with incoming event', async () => {
    const event = {
      type: 'EVENT_TYPE'
    }
    const { connect } = useViewModel(
      'view-model-name',
      ['aggregate-id'],
      mockStateChange,
      mockEventReceived
    )

    await connect()

    await emulateIncomingEvent(event)

    expect(mockEventReceived).toHaveBeenCalledWith(event)
  })
})
