import { SubscriptionKind } from '../../src/client'
/* eslint-disable import/first */
import { mocked } from 'ts-jest/utils'

import { SubscriptionAdapterStatus } from '../../src/types'
import * as subscribe from '../../src/subscribe'
import { viewModelCallback } from '../../src/subscribe-callback'
import { Context } from '../../src/context'
import { createSubscriptionAdapter } from '../../src/subscribe-adapter'

jest.useFakeTimers('legacy')

/* eslint-enable */

const { connect, disconnect, dropSubscribeAdapterPromise } = subscribe

let mFetch: any

const mockInit = jest.fn()
const mockCallback = jest.fn()
const mockStatus = jest.fn().mockReturnValue(SubscriptionAdapterStatus.Ready)
const mockClose = jest.fn()
const mockCreateSubscribeAdapter = mocked(createSubscriptionAdapter)

jest.mock('global/window', () => undefined)
jest.mock('../../src/subscribe-adapter', () => ({
  createSubscriptionAdapter: jest.fn(),
}))

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
      {
        url: 'subscribe-url',
        cursor: 'cursor',
        viewModelName: 'view-model',
        aggregateIds: ['aggregate-id-1'],
      },
      mockCallback
    )

    expect(mockCreateSubscribeAdapter).toBeCalledWith(
      {
        url: 'subscribe-url',
        cursor: 'cursor',
        viewModelName: 'view-model',
        aggregateIds: ['aggregate-id-1'],
      },
      viewModelCallback
    )
    expect(mockInit).toBeCalledTimes(1)
  })

  test('is subscribed', async () => {
    await connect(
      context,
      {
        url: 'subscribe-url',
        cursor: 'cursor',
        viewModelName: 'view-model',
        aggregateIds: ['aggregate-id-1'],
      },
      mockCallback
    )
    await connect(
      context,
      {
        url: 'subscribe-url',
        cursor: 'cursor',
        viewModelName: 'view-model',
        aggregateIds: ['aggregate-id-2'],
      },
      mockCallback
    )
    await connect(
      context,
      {
        url: 'subscribe-url',
        cursor: 'cursor',
        viewModelName: 'view-model',
        aggregateIds: ['aggregate-id-3'],
      },
      mockCallback
    )

    expect(mockCreateSubscribeAdapter).toBeCalledWith(
      {
        url: 'subscribe-url',
        cursor: 'cursor',
        viewModelName: 'view-model',
        aggregateIds: ['aggregate-id-1'],
      },
      viewModelCallback
    )
    expect(mockInit).toBeCalledTimes(3)
  })

  test('is unsubscribed', async () => {
    await connect(
      context,
      {
        url: 'subscribe-url',
        cursor: 'cursor',
        viewModelName: 'view-model',
        aggregateIds: ['aggregate-id-1'],
      },
      mockCallback
    )
    await connect(
      context,
      {
        url: 'subscribe-url',
        cursor: 'cursor',
        viewModelName: 'view-model',
        aggregateIds: ['aggregate-id-2'],
      },
      mockCallback
    )
    await connect(
      context,
      {
        url: 'subscribe-url',
        cursor: 'cursor',
        viewModelName: 'view-model',
        aggregateIds: ['aggregate-id-3'],
      },
      mockCallback
    )

    await disconnect(context, {
      kind: SubscriptionKind.viewModel,
      viewModelName: 'view-model',
      aggregateIds: ['aggregate-id-1'],
      handler: mockCallback,
    })
    await disconnect(context, {
      kind: SubscriptionKind.viewModel,
      viewModelName: 'view-model',
      aggregateIds: ['aggregate-id-2'],
      handler: mockCallback,
    })
    await disconnect(context, {
      kind: SubscriptionKind.viewModel,
      viewModelName: 'view-model',
      aggregateIds: ['aggregate-id-3'],
      handler: mockCallback,
    })
    expect(mockInit).toBeCalledTimes(3)
    expect(mockClose).toBeCalledTimes(3)
  })

  test('no multiple subscriptions', async () => {
    await connect(
      context,
      {
        url: 'subscribe-url',
        cursor: 'cursor',
        viewModelName: 'view-model',
        aggregateIds: ['aggregate-id-1'],
      },
      mockCallback
    )
    await connect(
      context,
      {
        url: 'subscribe-url',
        cursor: 'cursor',
        viewModelName: 'view-model',
        aggregateIds: ['aggregate-id-1'],
      },
      mockCallback
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
    mockCreateSubscribeAdapter.mockReturnValue({
      init: mockInit,
      close: mockClose,
      status: mockStatus,
    })
  })

  afterAll(() => {
    void ((global as any).fetch = undefined)
    refreshSpy.mockRestore()
  })

  beforeEach(async () => {
    jest.clearAllMocks()
    refreshSpy = jest.spyOn(subscribe, 'refreshSubscriptionAdapter')
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
      {
        url: 'subscribe-url',
        cursor: 'cursor',
        viewModelName: 'view-model',
        aggregateIds: ['aggregate-id-1'],
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

    await connect(
      context,
      {
        url: 'subscribe-url',
        cursor: 'cursor',
        viewModelName: 'view-model',
        aggregateIds: ['aggregate-id-1'],
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

  test('close on disconnected', async () => {
    await connect(
      context,
      {
        url: 'subscribe-url',
        cursor: 'cursor',
        viewModelName: 'view-model',
        aggregateIds: ['aggregate-id-1'],
      },
      mockCallback
    )

    expect(refreshSpy).not.toBeCalled()
    expect(setTimeout).toHaveBeenCalledTimes(1)
    expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 5000)

    mockStatus.mockReturnValueOnce(SubscriptionAdapterStatus.Closed)

    await disconnect(context, {
      kind: SubscriptionKind.viewModel,
      viewModelName: 'view-model',
      aggregateIds: ['aggregate-id-1'],
      handler: mockCallback,
    })

    jest.runOnlyPendingTimers()

    expect(mockClose).toBeCalled()
    expect(mockInit).toBeCalledTimes(1)
  })
})
