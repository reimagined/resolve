import type { ReadModelPool } from '../src/query/types'
import {
  subscribeImpl,
  resubscribeImpl,
  unsubscribeImpl,
} from '../src/query/wrap-read-model'

/* TODO remove these tests */

describe('method "subscribeImpl"', () => {
  test('should update a subscriber', async () => {
    const subscribers: Array<{ status: { status: string } }> = [
      {
        status: {
          status: 'skip',
        },
      },
    ]

    const getEventSubscribers = jest.fn().mockResolvedValue(subscribers)
    const ensureEventSubscriber = jest.fn()

    const pool = ({
      eventstoreAdapter: { getEventSubscribers, ensureEventSubscriber },
    } as unknown) as ReadModelPool

    await subscribeImpl(pool, 'readModelName', {
      subscriptionOptions: {
        eventTypes: ['ITEM_CREATE', 'ITEM_UPDATED', 'ITEM_DELETED'],
        aggregateIds: null,
      },
    })

    expect(getEventSubscribers).toHaveBeenCalled()
    expect(ensureEventSubscriber).toHaveBeenCalledWith({
      applicationName: pool.applicationName,
      eventSubscriber: 'readModelName',
      status: {
        eventSubscriber: 'readModelName',
        status: 'skip',
        busy: false,
        eventTypes: ['ITEM_CREATE', 'ITEM_UPDATED', 'ITEM_DELETED'],
        aggregateIds: null,
      },
      updateOnly: true,
    })
  })

  test('should do nothing when subscribers is empty', async () => {
    const subscribers: Array<{ status: { status: string } }> = []

    const getEventSubscribers = jest.fn().mockResolvedValue(subscribers)
    const ensureEventSubscriber = jest.fn()

    const pool = ({
      eventstoreAdapter: { getEventSubscribers, ensureEventSubscriber },
    } as unknown) as ReadModelPool

    await subscribeImpl(pool, 'readModelName', {
      subscriptionOptions: {
        eventTypes: ['ITEM_CREATE', 'ITEM_UPDATED', 'ITEM_DELETED'],
        aggregateIds: null,
      },
    })

    expect(getEventSubscribers).toHaveBeenCalled()
    expect(ensureEventSubscriber).not.toHaveBeenCalled()
  })
})

describe('method "resubscribeImpl"', () => {
  test('should update a subscriber and set { status: "skip", busy: false }', async () => {
    const ensureEventSubscriber = jest.fn()

    const pool = ({
      eventstoreAdapter: { ensureEventSubscriber },
    } as unknown) as ReadModelPool

    await resubscribeImpl(pool, 'readModelName', {
      subscriptionOptions: {
        eventTypes: ['ITEM_CREATE', 'ITEM_UPDATED', 'ITEM_DELETED'],
        aggregateIds: null,
      },
    })

    expect(ensureEventSubscriber).toHaveBeenCalledWith({
      applicationName: pool.applicationName,
      eventSubscriber: 'readModelName',
      status: {
        eventSubscriber: 'readModelName',
        status: 'skip',
        busy: false,
        eventTypes: ['ITEM_CREATE', 'ITEM_UPDATED', 'ITEM_DELETED'],
        aggregateIds: null,
      },
      updateOnly: true,
    })
  })
})

describe('method "unsubscribeImpl"', () => {
  test('should update a subscriber and set { status: null, updateOnly: true }', async () => {
    const ensureEventSubscriber = jest.fn()

    const pool = ({
      eventstoreAdapter: { ensureEventSubscriber },
    } as unknown) as ReadModelPool

    await unsubscribeImpl(pool, 'readModelName', {
      subscriptionOptions: {
        eventTypes: ['ITEM_CREATE', 'ITEM_UPDATED', 'ITEM_DELETED'],
        aggregateIds: null,
      },
    })

    expect(ensureEventSubscriber).toHaveBeenCalledWith({
      applicationName: pool.applicationName,
      eventSubscriber: 'readModelName',
      status: null,
      updateOnly: true,
    })
  })
})
