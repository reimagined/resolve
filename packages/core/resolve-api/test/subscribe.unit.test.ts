import * as subscribe from '../src/subscribe'

import { rootCallback } from '../src/view_model_subscribe_callback'

const { doSubscribe, doUnsubscribe, dropSubscribeAdapterPromise } = subscribe

jest.mock('../empty_subscribe_adapter')

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface Global {
      fetch?: Function
    }
  }
}

let mFetch

const mockInit = jest.fn()
const mockSubscribe = jest.fn()
const mockUnsubscribe = jest.fn()
const mockCallback = jest.fn()
const mockIsConnected = jest.fn().mockReturnValue(true)
const mockClose = jest.fn()

let mockSubscribeAdapter
let context

const clearMocks = (): void => {
  mockSubscribeAdapter.mockClear()
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
    global.fetch = mFetch
  })

  afterAll(() => {
    global.fetch = undefined
  })

  beforeEach(async () => {
    jest.useFakeTimers()
    mockSubscribeAdapter = jest.fn().mockReturnValue({
      init: mockInit,
      isConnected: mockIsConnected,
      subscribeToTopics: mockSubscribe,
      unsubscribeFromTopics: mockUnsubscribe
    })

    context = {
      origin: 'http://origin-url',
      rootPath: '',
      subscribeAdapter: mockSubscribeAdapter
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

    expect(mockSubscribeAdapter).toBeCalledWith({
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

    expect(mockSubscribeAdapter).toBeCalledWith({
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
  let refreshSpy

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
    global.fetch = mFetch
  })

  afterAll(() => {
    global.fetch = undefined
    refreshSpy.mockRestore()
  })

  beforeEach(async () => {
    jest.useFakeTimers()
    refreshSpy = jest.spyOn(subscribe, 'refreshSubscribeAdapter')
    mockSubscribeAdapter = jest.fn().mockReturnValue({
      init: mockInit,
      isConnected: mockIsConnected,
      close: mockClose,
      subscribeToTopics: mockSubscribe,
      unsubscribeFromTopics: mockUnsubscribe
    })

    context = {
      origin: 'http://origin-url',
      rootPath: '',
      subscribeAdapter: mockSubscribeAdapter
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
