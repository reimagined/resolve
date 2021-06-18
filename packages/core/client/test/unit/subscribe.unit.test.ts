jest.useFakeTimers('legacy')

/* eslint-disable import/first */
import { mocked } from 'ts-jest/utils'

import { SubscriptionAdapterStatus } from '../../src/types'
import * as subscribe from '../../src/subscribe'
import { rootCallback } from '../../src/subscribe-callback'
import { Context } from '../../src/context'
import createClientAdapter from '../../src/subscribe-adapter'
/* eslint-enable */

const { connect, disconnect, dropSubscribeAdapterPromise } = subscribe

let mFetch: any

const mockInit = jest.fn()
const mockCallback = jest.fn()
const mockStatus = jest.fn().mockReturnValue(SubscriptionAdapterStatus.Ready)
const mockClose = jest.fn()

const mockCreateSubscribeAdapter = mocked(createClientAdapter)

jest.mock('../../src/subscribe-adapter', () => jest.fn())

mockCreateSubscribeAdapter.adapterName = 'adapter-name'

let context: Context

const clearMocks = (): void => {
  mockCreateSubscribeAdapter.mockClear()
  mockClose.mockClear()
  mockInit.mockClear()
  mockCallback.mockClear()
}

describe('subscribe', () => {
  beforeAll(() => {
    mockCreateSubscribeAdapter.mockReturnValue({
      init: mockInit,
      close: mockClose,
      status: mockStatus,
    })

    mFetch = jest.fn(() => ({
      ok: true,
      status: 200,
      headers: {
        get: (): void => undefined,
      },
      json: (): Promise<object> =>
        Promise.resolve({ appId: 'application-id', url: 'subscribe-url' }),
      text: (): Promise<string> => Promise.resolve('response'),
    }))
    void ((global as any).fetch = mFetch)
  })

  afterAll(() => {
    void ((global as any).fetch = undefined)
  })

  beforeEach(async () => {
    context = {
      origin: 'http://origin-url',
      rootPath: '',
      staticPath: '',
      viewModels: [],
    }
  })

  afterEach(() => {
    clearMocks()
    dropSubscribeAdapterPromise()
  })

  test('init with params', async () => {
    await connect(
      context,
      'subscribe-url',
      'cursor',
      ['aggregate-id-1'],
      mockCallback,
      'view-model'
    )

    expect(mockCreateSubscribeAdapter).toBeCalledWith({
      onEvent: rootCallback,
      url: 'subscribe-url',
      cursor: 'cursor',
    })
    expect(mockInit).toBeCalledTimes(1)
  })

  test('is subscribed', async () => {
    await connect(
      context,
      'subscribe-url',
      'cursor',
      ['aggregate-id-1'],
      mockCallback,
      'view-model'
    )
    await connect(
      context,
      'subscribe-url',
      'cursor',
      ['aggregate-id-2'],
      mockCallback,
      'view-model'
    )
    await connect(
      context,
      'subscribe-url',
      'cursor',
      ['aggregate-id-3'],
      mockCallback,
      'view-model'
    )

    expect(mockCreateSubscribeAdapter).toBeCalledWith({
      onEvent: rootCallback,
      url: 'subscribe-url',
      cursor: 'cursor',
    })
    expect(mockInit).toBeCalledTimes(3)
  })

  test('is unsubscribed', async () => {
    await connect(
      context,
      'subscribe-url',
      'cursor',
      ['aggregate-id-1'],
      mockCallback,
      'view-model'
    )
    await connect(
      context,
      'subscribe-url',
      'cursor',
      ['aggregate-id-2'],
      mockCallback,
      'view-model'
    )
    await connect(
      context,
      'subscribe-url',
      'cursor',
      ['aggregate-id-3'],
      mockCallback,
      'view-model'
    )

    await disconnect(context, ['aggregate-id-1'], 'view-model', mockCallback)
    await disconnect(context, ['aggregate-id-2'], 'view-model', mockCallback)
    await disconnect(context, ['aggregate-id-3'], 'view-model', mockCallback)
    expect(mockInit).toBeCalledTimes(3)
    expect(mockClose).toBeCalledTimes(3)
  })

  test('no multiple subscriptions', async () => {
    await connect(
      context,
      'subscribe-url',
      'cursor',
      ['aggregate-id-1'],
      mockCallback,
      'view-model'
    )
    await connect(
      context,
      'subscribe-url',
      'cursor',
      ['aggregate-id-1'],
      mockCallback,
      'view-model'
    )
    await connect(
      context,
      'subscribe-url',
      'cursor',
      ['aggregate-id-1'],
      mockCallback,
      'view-model'
    )
    expect(mockInit).toBeCalledTimes(1)
  })
})

describe('re-subscribe', () => {
  let refreshSpy: jest.SpyInstance<Promise<any>>

  beforeAll(() => {
    mFetch = jest.fn(() => ({
      ok: true,
      status: 200,
      headers: {
        get: (): void => undefined,
      },
      json: (): Promise<object> =>
        Promise.resolve({ appId: 'application-id', url: 'subscribe-url' }),
      text: (): Promise<string> => Promise.resolve('response'),
    }))
    ;(global as any).fetch = mFetch
  })

  afterAll(() => {
    void ((global as any).fetch = undefined)
    refreshSpy.mockRestore()
  })

  beforeEach(async () => {
    jest.clearAllMocks()
    refreshSpy = jest.spyOn(subscribe, 'refreshSubscriptionAdapter')
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
    }
  })

  afterEach(() => {
    refreshSpy.mockClear()
    dropSubscribeAdapterPromise()
    clearMocks()
  })

  test('refresh executed first time on subscribe adapter creation', async () => {
    await connect(
      context,
      'subscribe-url',
      'cursor',
      ['aggregate-id-1'],
      mockCallback,
      'view-model'
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

    await connect(
      context,
      'subscribe-url',
      'cursor',
      ['aggregate-id-1'],
      mockCallback,
      'view-model'
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

  test('close on disconnected', async () => {
    await connect(
      context,
      'subscribe-url',
      'cursor',
      ['aggregate-id-1'],
      mockCallback,
      'view-model'
    )

    expect(refreshSpy).not.toBeCalled()
    expect(setTimeout).toHaveBeenCalledTimes(1)
    expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 5000)

    mockStatus.mockReturnValueOnce(SubscriptionAdapterStatus.Closed)

    await disconnect(context, ['aggregate-id-1'], 'view-model', mockCallback)

    jest.runOnlyPendingTimers()

    expect(mockClose).toBeCalled()
    expect(mockInit).toBeCalledTimes(1)
  })
})
