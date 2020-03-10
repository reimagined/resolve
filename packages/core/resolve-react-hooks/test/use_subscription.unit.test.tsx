import React, { FunctionComponent, ReactNode } from 'react'
import { renderHook } from '@testing-library/react-hooks'

import { mocked } from 'ts-jest/utils'
import { getApi } from 'resolve-api'
import { useSubscription } from '../src/use_subscription'
import { ResolveContext } from '../src/context'

jest.mock('resolve-api')
const mockedGetApi = mocked(getApi)

const eventHandler = jest.fn()
const subscribeHandler = jest.fn()
const resubscribeHandler = jest.fn()

const apiSubscribeMock = jest
  .fn()
  .mockImplementation((arg1, arg2, arg3, callback) => {
    callback(null, 'subscription-object')
    return {}
  })
const apiUnsubscribeMock = jest.fn().mockResolvedValue({})

const clearMocks = () => {
  mockedGetApi.mockClear()
  apiSubscribeMock.mockClear()
  apiUnsubscribeMock.mockClear()

  subscribeHandler.mockClear()
}

const contextValue = {
  origin: '',
  rootPath: '',
  staticPath: '',
  viewModels: [
    { name: 'view-model-name', projection: [], deserializeState: () => ({}) },
    {
      name: 'another-view-model-name',
      projection: [],
      deserializeState: () => ({})
    }
  ]
}

type ContextChildrenProps = {
  children?: ReactNode
}

// const contextWrapper: FunctionComponent<React.PropsWithChildren<ContextChildrenProps>> = ({
const contextWrapper: FunctionComponent<ContextChildrenProps> = ({
  children
}) => (
  <ResolveContext.Provider value={contextValue}>
    {children}
  </ResolveContext.Provider>
)

describe('useSubscription', () => {
  beforeAll(() => {
    mockedGetApi.mockReturnValue({
      command: jest.fn(),
      query: jest.fn(),
      getStaticAssetUrl: jest.fn(),
      subscribeTo: apiSubscribeMock,
      unsubscribe: apiUnsubscribeMock
    })
  })

  beforeEach(() => {
    clearMocks()
  })

  test('subscribing once', async () => {
    const { unmount } = renderHook(
      () =>
        useSubscription(
          'view-model-name',
          ['aggregate-id'],
          eventHandler,
          subscribeHandler,
          resubscribeHandler
        ),
      { wrapper: contextWrapper }
    )

    expect(apiSubscribeMock).toBeCalledTimes(1)
    expect(apiSubscribeMock).toBeCalledWith(
      'view-model-name',
      ['aggregate-id'],
      eventHandler,
      expect.any(Function),
      resubscribeHandler
    )
    expect(subscribeHandler).toBeCalledTimes(1)
    unmount()
    expect(apiUnsubscribeMock).toBeCalled()
  })

  test('subscribing multiple times', () => {
    const { unmount: unmount1 } = renderHook(
      () =>
        useSubscription(
          'view-model-name',
          ['aggregate-id-1'],
          eventHandler,
          subscribeHandler,
          resubscribeHandler
        ),
      { wrapper: contextWrapper }
    )
    const { unmount: unmount2 } = renderHook(
      () =>
        useSubscription(
          'view-model-name',
          ['aggregate-id-2'],
          eventHandler,
          subscribeHandler,
          resubscribeHandler
        ),
      { wrapper: contextWrapper }
    )
    const { unmount: unmount3 } = renderHook(
      () =>
        useSubscription(
          'view-model-name',
          ['aggregate-id-3'],
          eventHandler,
          subscribeHandler,
          resubscribeHandler
        ),
      { wrapper: contextWrapper }
    )

    expect(apiSubscribeMock).toBeCalledTimes(3)
    expect(apiSubscribeMock).toBeCalledWith(
      'view-model-name',
      ['aggregate-id-1'],
      eventHandler,
      expect.any(Function),
      resubscribeHandler
    )
    expect(apiSubscribeMock).toBeCalledWith(
      'view-model-name',
      ['aggregate-id-2'],
      eventHandler,
      expect.any(Function),
      resubscribeHandler
    )
    expect(apiSubscribeMock).toBeCalledWith(
      'view-model-name',
      ['aggregate-id-3'],
      eventHandler,
      expect.any(Function),
      resubscribeHandler
    )
    unmount1()
    expect(apiUnsubscribeMock).toBeCalledTimes(1)
    unmount2()
    expect(apiUnsubscribeMock).toBeCalledTimes(2)
    unmount3()
    expect(apiUnsubscribeMock).toBeCalledTimes(3)
  })

  test('not subscribing if no such view model', () => {
    const { unmount } = renderHook(
      () =>
        useSubscription(
          'unknown-view-model-name',
          ['aggregate-id'],
          eventHandler,
          subscribeHandler,
          resubscribeHandler
        ),
      { wrapper: contextWrapper }
    )

    unmount()
    expect(apiSubscribeMock).toBeCalledTimes(0)
    expect(apiUnsubscribeMock).toBeCalledTimes(0)
  })
})
