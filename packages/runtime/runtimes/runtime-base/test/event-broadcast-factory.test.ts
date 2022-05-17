import { mocked } from 'jest-mock'
import type { EventPointer } from '@resolve-js/core'

import type { EventListener } from '../src/types'
import type { NotifierRuntime } from '../src/event-broadcast-factory'

import { isMatchEventType, broadcaster } from '../src/event-broadcast-factory'

jest.mock('../src/utils', () => ({
  createEventSubscriberNotification: (
    eventSubscriber: any,
    eventPointer: any
  ) => ({
    eventSubscriber,
    eventPointer,
  }),
  getLog: () => ({
    // eslint-disable-next-line no-console
    debug: (...args: Array<any>) => console.debug(...args),
    // eslint-disable-next-line no-console
    warn: (...args: Array<any>) => console.warn(...args),
  }),
}))

describe('broadcaster', () => {
  const applicationName = 'applicationName'

  const eventListeners = new Map<string, EventListener>()
  eventListeners.set('ItemList', {
    name: 'ItemList',
    connectorName: 'default',
    eventTypes: ['ITEM_CREATED', 'ITEM_DELETED'],
    invariantHash: 'hash-1',
    isSaga: false,
  })
  eventListeners.set('ItemValues', {
    name: 'ItemValues',
    connectorName: 'default',
    eventTypes: ['ITEM_CREATED', 'ITEM_DELETED', 'ITEM_UPDATED'],
    invariantHash: 'hash-2',
    isSaga: false,
  })
  eventListeners.set('Users', {
    name: 'Users',
    connectorName: 'default',
    eventTypes: ['USER_CREATED', 'USER_DELETED'],
    invariantHash: 'hash-2',
    isSaga: false,
  })

  const destination = 'destination'

  const getEventSubscribers = () =>
    Array.from(eventListeners.entries()).map(
      ([eventSubscriber, { eventTypes }]) => ({
        eventSubscriber,
        applicationName,
        destination,
        status: {
          eventTypes,
        },
      })
    )

  const invokeBuildAsync = jest.fn()
  const notifyEventSubscriber = jest.fn()

  const eventSubscriber: NotifierRuntime['eventSubscriber'] = {
    deleteProperty: jest.fn(),
    listProperties: jest.fn(),
    getProperty: jest.fn(),
    setProperty: jest.fn(),
    subscribe: jest.fn(),
    resubscribe: jest.fn(),
    unsubscribe: jest.fn(),
    build: jest.fn(),
    resume: jest.fn(),
    pause: jest.fn(),
    reset: jest.fn(),
    status: jest.fn().mockResolvedValue({ isAlive: false }),
  }

  const runtime: NotifierRuntime = {
    eventSubscriberScope: applicationName,
    eventListeners,
    eventStoreAdapter: {
      getEventSubscribers,
    } as any,
    getVacantTimeInMillis: () => 1000 * 60 * 60,
    invokeBuildAsync,
    notifyEventSubscriber,
    eventSubscriber,
  }

  const eventPointer: EventPointer = {
    event: {
      aggregateId: 'id1',
      aggregateVersion: 1,
      type: 'ITEM_CREATED',
      timestamp: Date.now(),
      payload: {},
    },
    cursor: '<some-cursor>',
  }

  afterEach(() => {
    invokeBuildAsync.mockReset()
    notifyEventSubscriber.mockReset()
  })

  test('should call runtime.invokeBuildAsync for a matched event types only', async () => {
    await broadcaster(runtime, eventPointer)

    expect(invokeBuildAsync).toHaveBeenCalledTimes(2)
    expect(invokeBuildAsync).toHaveBeenCalledWith({
      eventPointer,
      eventSubscriber: 'ItemList',
    })
    expect(invokeBuildAsync).toHaveBeenCalledWith({
      eventPointer,
      eventSubscriber: 'ItemValues',
    })

    expect(notifyEventSubscriber).toHaveBeenCalledTimes(0)
  })

  test('should not call runtime.invokeBuildAsync if subscriber status isAlive', async () => {
    mocked(runtime.eventSubscriber).status.mockResolvedValueOnce({
      isAlive: true,
    })

    await broadcaster(runtime, eventPointer)

    expect(invokeBuildAsync).toHaveBeenCalledTimes(1)
    expect(invokeBuildAsync).not.toHaveBeenCalledWith({
      eventPointer,
      eventSubscriber: 'ItemList',
    })
    expect(invokeBuildAsync).toHaveBeenCalledWith({
      eventPointer,
      eventSubscriber: 'ItemValues',
    })

    expect(notifyEventSubscriber).toHaveBeenCalledTimes(0)
  })

  test('should not wait for runtime.eventSubscriber.status for more than 300 ms', async () => {
    mocked(runtime.eventSubscriber).status.mockReturnValue(
      new Promise((resolve) => {
        void resolve
      })
    )

    await broadcaster(runtime, eventPointer)

    expect(invokeBuildAsync).toHaveBeenCalledTimes(2)
    expect(invokeBuildAsync).toHaveBeenCalledWith({
      eventPointer,
      eventSubscriber: 'ItemList',
    })
    expect(invokeBuildAsync).toHaveBeenCalledWith({
      eventPointer,
      eventSubscriber: 'ItemValues',
    })

    expect(notifyEventSubscriber).toHaveBeenCalledTimes(0)
  })
})

describe('method "isMatchEventType"', () => {
  test('should return true when eventTypes includes eventType', () => {
    expect(
      isMatchEventType(
        ['ITEM_CREATED', 'ITEM_UPDATED', 'ITEM_DELETED'],
        'ITEM_CREATED'
      )
    ).toEqual(true)
    expect(
      isMatchEventType(
        ['ITEM_CREATED', 'ITEM_UPDATED', 'ITEM_DELETED'],
        'ITEM_UPDATED'
      )
    ).toEqual(true)
    expect(
      isMatchEventType(
        ['ITEM_CREATED', 'ITEM_UPDATED', 'ITEM_DELETED'],
        'ITEM_DELETED'
      )
    ).toEqual(true)
  })

  test('should return false when eventTypes not includes eventType', () => {
    expect(
      isMatchEventType(
        ['ITEM_CREATED', 'ITEM_UPDATED', 'ITEM_DELETED'],
        'NOT_MATCHED_TYPE'
      )
    ).toEqual(false)
  })
})
