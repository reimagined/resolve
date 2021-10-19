import React from 'react'
import { Context, QueryResult } from '@resolve-js/client'
import { renderHook } from '@testing-library/react-hooks'
import { mocked } from 'ts-jest/utils'
import { ResolveContext } from '../src/context'
import { useClient } from '../src/use-client'
import { useViewModel } from '../src/use-view-model'

jest.mock('@resolve-js/client')
const projectionInitHandler = jest.fn(() => ({ initializedOnClient: true }))

const mockContext: Context = {
  origin: 'mock-origin',
  rootPath: 'mock-root-path',
  staticPath: 'mock-static-path',
  viewModels: [
    {
      name: 'view-model-name',
      projection: {
        Init: projectionInitHandler,
        EVENT_TYPE: (state: any, event: any) => ({
          ...state,
          appliedEvent: event,
        }),
      },
      deserializeState: (): object => ({}),
    },
    {
      name: 'another-view-model-name',
      projection: {
        Init: () => null,
      },
      deserializeState: (): object => ({}),
    },
  ],
}

const mockClient = {
  command: jest.fn(),
  query: jest.fn<Promise<QueryResult>, any>(() =>
    Promise.resolve({
      data: {
        queried: 'result',
      },
      meta: {
        timestamp: 1,
        url: 'url',
        cursor: 'cursor',
      },
    })
  ),
  getStaticAssetUrl: jest.fn(),
  getOriginPath: jest.fn(),
  subscribe: jest.fn().mockResolvedValue({ key: 'subscription-data' }),
  unsubscribe: jest.fn(),
}

jest.mock('../src/use-client', () => ({
  useClient: jest.fn(() => mockClient),
}))

const mockedUseClient = mocked(useClient)
const mockStateChange = jest.fn()
const mockEventReceived = jest.fn()

const clearMocks = (): void => {
  mockedUseClient.mockClear()

  mockClient.query.mockClear()
  mockClient.subscribe.mockClear()
  mockClient.unsubscribe.mockClear()

  mockStateChange.mockClear()
  mockEventReceived.mockClear()

  projectionInitHandler.mockClear()
}

function renderWrapped<R>(
  cb: (props: { context: Context | null }) => R,
  context: Context | null = mockContext
) {
  return renderHook<{ context: Context | null }, R>(cb, {
    wrapper: (props) => (
      <ResolveContext.Provider value={props.context}>
        {props.children}
      </ResolveContext.Provider>
    ),
    initialProps: {
      context,
    },
  })
}

beforeAll(() => {
  mockedUseClient.mockReturnValue(mockClient)
})

afterEach(() => {
  clearMocks()
})

describe('common', () => {
  test('client requested for specified context', () => {
    renderWrapped(() =>
      useViewModel('view-model-name', ['aggregate-id'], mockStateChange)
    )

    expect(mockedUseClient).toHaveBeenCalledTimes(1)
  })

  test('returns functions', () => {
    const { connect, dispose } = renderWrapped(() =>
      useViewModel('view-model-name', ['aggregate-id'], mockStateChange)
    ).result.current

    expect(connect).toBeInstanceOf(Function)
    expect(dispose).toBeInstanceOf(Function)
  })

  test('fail if no context found', () => {
    expect(
      renderWrapped(
        () =>
          useViewModel('view-model-name', ['aggregate-id'], mockStateChange),
        null
      ).result.error
    ).toBeInstanceOf(Error)
  })

  test('fail if no state changed callback set', () => {
    const dynamic = useViewModel as Function

    expect(
      renderWrapped(() => dynamic('view-model-name', ['aggregate-id'])).result
        .error
    ).toEqual(Error('state change callback required'))

    expect(
      renderWrapped(() => dynamic('view-model-name', ['aggregate-id'], {}))
        .result.error
    ).toEqual(Error('state change callback required'))
  })
})

describe('call', () => {
  const emulateIncomingEvent = async (event: any) => {
    const subscriptionEventHandler = mockClient.subscribe.mock.calls[0][4]
    await subscriptionEventHandler(event)
  }

  test('connect as promise', async () => {
    const {
      result: {
        current: { connect },
      },
    } = renderWrapped(() =>
      useViewModel('view-model-name', ['aggregate-id'], mockStateChange)
    )

    await connect()

    expect(mockClient.query).toBeCalledWith(
      {
        aggregateIds: ['aggregate-id'],
        args: undefined,
        name: 'view-model-name',
      },
      undefined
    )

    expect(mockClient.subscribe).toBeCalledWith(
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
    const {
      result: {
        current: { connect },
      },
    } = renderWrapped(() =>
      useViewModel('view-model-name', ['aggregate-id'], mockStateChange, {
        method: 'POST',
      })
    )

    await connect()
    expect(mockClient.query).toBeCalledWith(
      {
        aggregateIds: ['aggregate-id'],
        args: undefined,
        name: 'view-model-name',
      },
      {
        method: 'POST',
      }
    )
    expect(mockClient.subscribe).toBeCalledWith(
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
    const {
      result: {
        current: { connect, dispose },
      },
    } = renderWrapped(() =>
      useViewModel('view-model-name', ['aggregate-id'], mockStateChange)
    )
    await connect()
    await dispose()

    expect(mockClient.unsubscribe).toBeCalledWith({
      key: 'subscription-data',
    })
  })

  test('connect with callback', (done) => {
    const {
      result: {
        current: { connect },
      },
    } = renderWrapped(() =>
      useViewModel('view-model-name', ['aggregate-id'], mockStateChange)
    )

    const callback = jest.fn(done)
    const result = connect(callback)
    expect(result).toBeUndefined()
  })

  test('dispose with callback', async () => {
    const {
      result: {
        current: { connect, dispose },
      },
    } = renderWrapped(() =>
      useViewModel('view-model-name', ['aggregate-id'], mockStateChange)
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
    renderWrapped(() =>
      useViewModel('view-model-name', ['aggregate-id'], mockStateChange)
    )

    expect(projectionInitHandler).toHaveBeenCalled()
  })

  test('state changed callback invoked on connect with initial state', async () => {
    const {
      result: {
        current: { connect },
      },
    } = renderWrapped(() =>
      useViewModel('view-model-name', ['aggregate-id'], mockStateChange)
    )

    await connect()

    expect(mockStateChange).toHaveBeenCalledWith(
      {
        initializedOnClient: true,
      },
      true
    )
  })

  test('state changed callback invoked with initial, and then queried state on connect', async () => {
    const {
      result: {
        current: { connect },
      },
    } = renderWrapped(() =>
      useViewModel('view-model-name', ['aggregate-id'], mockStateChange)
    )

    await connect()

    expect(mockStateChange.mock.calls[0]).toEqual([
      {
        initializedOnClient: true,
      },
      true,
    ])
    expect(mockStateChange.mock.calls[1]).toEqual([
      {
        queried: 'result',
      },
      false,
    ])
  })

  test('state changed callback invoked with updated state', async () => {
    const event = {
      type: 'EVENT_TYPE',
    }
    const {
      result: {
        current: { connect },
      },
    } = renderWrapped(() =>
      useViewModel('view-model-name', ['aggregate-id'], mockStateChange)
    )

    await connect()

    await emulateIncomingEvent(event)

    expect(mockStateChange).toHaveBeenCalledWith(
      {
        queried: 'result',
        appliedEvent: event,
      },
      false
    )
  })

  test('event received callback invoked with incoming event', async () => {
    const event = {
      type: 'EVENT_TYPE',
    }
    const {
      result: {
        current: { connect },
      },
    } = renderWrapped(() =>
      useViewModel(
        'view-model-name',
        ['aggregate-id'],
        mockStateChange,
        mockEventReceived
      )
    )

    await connect()

    await emulateIncomingEvent(event)

    expect(mockEventReceived).toHaveBeenCalledWith(event)
  })

  test('state re-requested on resubscribe callback', async () => {
    const {
      result: {
        current: { connect },
      },
    } = renderWrapped(() =>
      useViewModel(
        'view-model-name',
        ['aggregate-id'],
        mockStateChange,
        mockEventReceived
      )
    )

    await connect()

    const reconnectCallback = mockClient.subscribe.mock.calls[0][6]

    clearMocks()

    await reconnectCallback()

    expect(mockClient.query).toHaveBeenCalled()
    expect(mockStateChange).toHaveBeenCalled()
  })

  test('pass view model arguments to client', async () => {
    const {
      result: {
        current: { connect },
      },
    } = renderWrapped(() =>
      useViewModel(
        'view-model-name',
        ['aggregate-id'],
        {
          a: 'a',
        },
        mockStateChange
      )
    )

    await connect()

    expect(mockClient.query).toBeCalledWith(
      expect.objectContaining({
        aggregateIds: ['aggregate-id'],
        args: { a: 'a' },
        name: 'view-model-name',
      }),
      undefined
    )
  })

  test('initial state returned', () => {
    const {
      result: {
        current: { initialState },
      },
    } = renderWrapped(() =>
      useViewModel('view-model-name', ['aggregate-id'], mockStateChange)
    )

    expect(initialState).toEqual({ initializedOnClient: true })
  })

  test('#1524: malformed cursor during connect if no events applied to a view model', async () => {
    mockClient.query.mockResolvedValueOnce({
      data: {
        queried: 'result',
      },
      meta: {
        timestamp: 1,
        url: 'url',
        cursor: null,
      },
    })

    const {
      result: {
        current: { connect },
      },
    } = renderWrapped(() =>
      useViewModel('view-model-name', ['aggregate-id'], mockStateChange)
    )

    await connect()

    expect(mockClient.subscribe).toHaveBeenCalledWith(
      expect.any(String),
      null,
      expect.any(String),
      expect.any(Array),
      expect.any(Function),
      undefined,
      expect.any(Function)
    )
  })

  test('#1715: "eventReceived" action creator never called', async () => {
    const event = {
      type: 'EVENT_TYPE',
    }
    const {
      result: {
        current: { connect },
      },
    } = renderWrapped(() =>
      useViewModel(
        'view-model-name',
        ['aggregate-id'],
        {},
        mockStateChange,
        mockEventReceived
      )
    )

    await connect()

    await emulateIncomingEvent(event)

    expect(mockEventReceived).toHaveBeenCalledWith(event)
  })

  test('#1874: connect as promise with aggregateIds returned by resolver', async () => {
    const {
      result: {
        current: { connect },
      },
    } = renderWrapped(() =>
      useViewModel('view-model-name', ['aggregate-id'], mockStateChange)
    )

    mockClient.query.mockResolvedValueOnce({
      data: {
        queried: 'result',
      },
      meta: {
        timestamp: 1,
        url: 'url',
        cursor: 'cursor',
        aggregateIds: ['modified-aggregate-id'],
      },
    })

    await connect()

    expect(mockClient.subscribe).toBeCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      ['modified-aggregate-id'],
      expect.any(Function),
      undefined,
      expect.any(Function)
    )
  })
})
