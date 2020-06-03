jest.useFakeTimers()

/* eslint-disable import/first */
import * as subscribe from '../../src/subscribe'
import { rootCallback } from '../../src/subscribe-callback'
import { Context } from '../../src/context'
import { CreateSubscribeAdapter } from '../../src/empty-subscribe-adapter'
/* eslint-enable */

const { doSubscribe, doUnsubscribe, dropSubscribeAdapterPromise } = subscribe

jest.mock('../../src/empty-subscribe-adapter')

let mFetch: any

const mockInit = jest.fn()
const mockSubscribe = jest.fn()
const mockUnsubscribe = jest.fn()
const mockCallback = jest.fn()
const mockIsConnected = jest.fn().mockReturnValue(true)
const mockClose = jest.fn()

const mockCreateSubscribeAdapter: jest.MockedFunction<CreateSubscribeAdapter> = jest
  .fn()
  .mockReturnValue({
    init: mockInit,
    close: mockClose,
    isConnected: mockIsConnected,
    subscribeToTopics: mockSubscribe,
    unsubscribeFromTopics: mockUnsubscribe
  })
mockCreateSubscribeAdapter.adapterName = 'adapter-name'

let context: Context

const clearMocks = (): void => {
  mockCreateSubscribeAdapter.mockClear()
  mockClose.mockClear()
  mockInit.mockClear()
  mockSubscribe.mockClear()
  mockUnsubscribe.mockClear()
  mockCallback.mockClear()
}

describe('subscribe', () => {
  beforeAll(() => {
    mFetch = jest.fn(() => ({
      ok: true,
      status: 200,
      headers: {
        get: (): void => undefined
      },
      json: (): Promise<object> =>
        Promise.resolve({ appId: 'application-id', url: 'http://options-url' }),
      text: (): Promise<string> => Promise.resolve('response')
    }))
    ;(global as any).fetch = mFetch
  })

  afterAll(() => {
    ;(global as any).fetch = undefined
  })

  beforeEach(async () => {
    context = {
      origin: 'http://origin-url',
      rootPath: '',
      staticPath: '',
      viewModels: [],
      subscribeAdapter: mockCreateSubscribeAdapter
    }
  })

  afterEach(() => {
    clearMocks()
    dropSubscribeAdapterPromise()
  })

  test('init with params', async () => {
    await doSubscribe(
      context,
      {
        topicName: 'event-type-1',
        topicId: 'aggregate-id-1'
      },
      mockCallback
    )

    expect(mockCreateSubscribeAdapter).toBeCalledWith({
      appId: 'application-id',
      onEvent: rootCallback,
      origin: 'http://origin-url',
      rootPath: '',
      url: 'http://options-url'
    })
    expect(mockInit).toBeCalledTimes(1)
    expect(mockSubscribe).toBeCalledTimes(1)
  })

  test('init only once with params', async () => {
    await doSubscribe(
      context,
      {
        topicName: 'event-type-1',
        topicId: 'aggregate-id-1'
      },
      mockCallback
    )
    await doSubscribe(
      context,
      {
        topicName: 'event-type-2',
        topicId: 'aggregate-id-2'
      },
      mockCallback
    )
    await doSubscribe(
      context,
      {
        topicName: 'event-type-3',
        topicId: 'aggregate-id-3'
      },
      mockCallback
    )

    expect(mockCreateSubscribeAdapter).toBeCalledWith({
      appId: 'application-id',
      onEvent: rootCallback,
      origin: 'http://origin-url',
      rootPath: '',
      url: 'http://options-url'
    })
    expect(mockInit).toBeCalledTimes(1)
  })

  test('is subscribed', async () => {
    await doSubscribe(
      context,
      {
        topicName: 'event-type-1',
        topicId: 'aggregate-id-1'
      },
      mockCallback
    )
    await doSubscribe(
      context,
      {
        topicName: 'event-type-2',
        topicId: 'aggregate-id-2'
      },
      mockCallback
    )
    await doSubscribe(
      context,
      {
        topicName: 'event-type-3',
        topicId: 'aggregate-id-3'
      },
      mockCallback
    )
    expect(mockSubscribe).toBeCalledTimes(3)
  })

  test('is unsubscribed', async () => {
    await doSubscribe(
      context,
      {
        topicName: 'event-type-1',
        topicId: 'aggregate-id-1'
      },
      mockCallback
    )
    await doSubscribe(
      context,
      {
        topicName: 'event-type-2',
        topicId: 'aggregate-id-2'
      },
      mockCallback
    )
    await doSubscribe(
      context,
      {
        topicName: 'event-type-3',
        topicId: 'aggregate-id-3'
      },
      mockCallback
    )

    await doUnsubscribe(
      context,
      {
        topicName: 'event-type-1',
        topicId: 'aggregate-id-1'
      },
      mockCallback
    )
    await doUnsubscribe(
      context,
      {
        topicName: 'event-type-2',
        topicId: 'aggregate-id-2'
      },
      mockCallback
    )
    await doUnsubscribe(
      context,
      {
        topicName: 'event-type-3',
        topicId: 'aggregate-id-3'
      },
      mockCallback
    )
    expect(mockSubscribe).toBeCalledTimes(3)
    expect(mockUnsubscribe).toBeCalledTimes(3)
  })

  test('no multiple subscriptions', async () => {
    await doSubscribe(
      context,
      {
        topicName: 'event-type-1',
        topicId: 'aggregate-id-1'
      },
      mockCallback
    )
    await doSubscribe(
      context,
      {
        topicName: 'event-type-1',
        topicId: 'aggregate-id-1'
      },
      mockCallback
    )
    await doSubscribe(
      context,
      {
        topicName: 'event-type-1',
        topicId: 'aggregate-id-1'
      },
      mockCallback
    )
    expect(mockSubscribe).toBeCalledTimes(1)
  })
})

describe('re-subscribe', () => {
  let refreshSpy: jest.SpyInstance<Promise<any>>

  beforeAll(() => {
    mFetch = jest.fn(() => ({
      ok: true,
      status: 200,
      headers: {
        get: (): void => undefined
      },
      json: (): Promise<object> =>
        Promise.resolve({ appId: 'application-id', url: 'http://options-url' }),
      text: (): Promise<string> => Promise.resolve('response')
    }))
    ;(global as any).fetch = mFetch
  })

  afterAll(() => {
    ;(global as any).fetch = undefined
    refreshSpy.mockRestore()
  })

  beforeEach(async () => {
    jest.clearAllMocks()
    refreshSpy = jest.spyOn(subscribe, 'refreshSubscribeAdapter')
    /* mockCreateSubscribeAdapter = jest.fn().mockReturnValue({
      init: mockInit,
      isConnected: mockIsConnected,
      close: mockClose,
      subscribeToTopics: mockSubscribe,
      unsubscribeFromTopics: mockUnsubscribe,
      adapterName: 'adapter-name'
    }) */

    context = {
      origin: 'http://origin-url',
      rootPath: '',
      staticPath: '',
      viewModels: [],
      subscribeAdapter: mockCreateSubscribeAdapter
    }
  })

  afterEach(() => {
    refreshSpy.mockClear()
    dropSubscribeAdapterPromise()
    clearMocks()
  })

  test('refresh executed first time on subscribe adapter creation', async () => {
    await doSubscribe(
      context,
      {
        topicName: 'event-type-1',
        topicId: 'aggregate-id-1'
      },
      mockCallback
    )

    expect(refreshSpy).not.toBeCalled()

    expect(setTimeout).toHaveBeenCalledTimes(1)
    expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 5000)

    jest.runOnlyPendingTimers()

    expect(refreshSpy).toBeCalledTimes(1)
  })

  test('refresh schedules itself', async () => {
    expect(setTimeout).not.toBeCalled()
    expect(refreshSpy).not.toBeCalled()

    await doSubscribe(
      context,
      {
        topicName: 'event-type-1',
        topicId: 'aggregate-id-1'
      },
      mockCallback
    )

    expect(setTimeout).toHaveBeenCalledTimes(1) // initial call of resfresh
    expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 5000)

    jest.runOnlyPendingTimers()

    expect(refreshSpy).toBeCalledTimes(1)

    await Promise.resolve()

    expect(setTimeout).toHaveBeenCalledTimes(2) // scheduling next call of refresh
    expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 5000)

    jest.runOnlyPendingTimers()

    expect(refreshSpy).toBeCalledTimes(2)
  })

  test('close, recreate and reschedule on disconnected', async () => {
    await doSubscribe(
      context,
      {
        topicName: 'event-type-1',
        topicId: 'aggregate-id-1'
      },
      mockCallback
    )

    expect(refreshSpy).not.toBeCalled()
    expect(setTimeout).toHaveBeenCalledTimes(1)
    expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 5000)

    mockIsConnected.mockReturnValueOnce(false)

    jest.runOnlyPendingTimers()

    await Promise.resolve()

    expect(mockClose).toBeCalled()
    expect(mockSubscribe).toBeCalledTimes(1)
  })
})
