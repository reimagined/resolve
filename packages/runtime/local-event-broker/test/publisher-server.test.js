import {
  DeliveryStrategy,
  NotificationStatus,
  PrivateOperationType,
  SubscriptionStatus,
  LazinessStrategy,
  ConsumerMethod,
  QueueStrategy,
} from '../src/publisher-server/constants'

// broker
import subscribe from '../src/publisher-server/broker/subscribe'
import unsubscribe from '../src/publisher-server/broker/unsubscribe'
import resubscribe from '../src/publisher-server/broker/resubscribe'
import acknowledge from '../src/publisher-server/broker/acknowledge'
import publish from '../src/publisher-server/broker/publish'
import status from '../src/publisher-server/broker/status'
import resume from '../src/publisher-server/broker/resume'
import pause from '../src/publisher-server/broker/pause'
import reset from '../src/publisher-server/broker/reset'
import read from '../src/publisher-server/broker/read'

// core
import acknowledgeBatch from '../src/publisher-server/core/acknowledge-batch'
import finalizeAndReportBatch from '../src/publisher-server/core/finalize-and-report-batch'
import generateGuid from '../src/publisher-server/core/generate-guid'
import invokeConsumer from '../src/publisher-server/core/invoke-consumer'
import invokeOperation from '../src/publisher-server/core/invoke-operation'
import parseSubscription from '../src/publisher-server/core/parse-subscription'
import pullNotificationsAsBatchForSubscriber from '../src/publisher-server/core/pull-notifications-as-batch-for-subscriber'
import pushNotificationAndGetSubscriptions from '../src/publisher-server/core/push-notification-and-get-subscriptions'
import requestTimeout from '../src/publisher-server/core/request-timeout'
import resumeSubscriber from '../src/publisher-server/core/resume-subscriber'
import serializeError from '../src/publisher-server/core/serialize-error'

jest.mock('../src/publisher-server/core/invoke-consumer', () =>
  jest.fn().mockReturnValue(true)
)
jest.mock('../src/publisher-server/core/invoke-operation', () => jest.fn())
jest.mock('../src/publisher-server/core/get-next-cursor', () =>
  jest.fn(() => 'nextCursor')
)

const escapeId = (str) => `"${String(str).replace(/(["])/gi, '$1$1')}"`
const escapeStr = (str) => `'${String(str).replace(/(['])/gi, '$1$1')}'`

const clearMocks = () => {
  invokeConsumer.mockClear()
  invokeOperation.mockClear()
}

describe('Broker operation', () => {
  let DateNow = null
  let MathRandom = null
  beforeAll(() => {
    DateNow = global.Date.now
    global.Date.now = jest.fn(() => 1)
    MathRandom = global.Math.random
    global.Math.random = jest.fn(() => 2)
  })
  afterAll(() => {
    global.Date.now = DateNow
    global.Math.random = MathRandom
  })

  afterEach(() => {
    clearMocks()
  })

  test('acknowledge', async () => {
    const pool = {
      invokeOperation,
    }
    const payload = {
      batchId: 'batchId',
      result: {},
    }

    await acknowledge(pool, payload)

    expect(invokeOperation).toHaveBeenCalledWith(pool, LazinessStrategy.EAGER, {
      type: PrivateOperationType.ACKNOWLEDGE_BATCH,
      payload: {
        ...payload,
      },
    })
  })

  test('pause', async () => {
    const pool = {
      database: {
        runQuery: jest.fn(() => [
          {
            status: SubscriptionStatus.DELIVER,
            subscriptionId: 'subscriptionId',
          },
        ]),
        runRawQuery: jest.fn(),
        escapeId,
        escapeStr,
      },
      parseSubscription,
    }
    const payload = {
      eventSubscriber: 'eventSubscriber',
    }

    const result = await pause(pool, payload)

    expect(result).toEqual('subscriptionId')
    expect(pool.database.runRawQuery).toMatchSnapshot()
    expect(pool.database.runQuery).toMatchSnapshot()
  })

  test('publish', async () => {
    const pool = {
      invokeOperation,
      invokeConsumer,
    }
    const payload = {
      event: {
        type: 'busEvent',
      },
    }

    await publish(pool, payload)

    expect(invokeConsumer).toHaveBeenCalledWith(
      pool,
      ConsumerMethod.SaveEvent,
      {
        event: payload.event,
      }
    )
    expect(invokeOperation).toHaveBeenCalledWith(pool, LazinessStrategy.EAGER, {
      type: PrivateOperationType.PUSH_NOTIFICATIONS,
      payload,
    })
  })

  test('read', async () => {
    const pool = {
      invokeConsumer,
    }
    const payload = {
      eventFilter: {
        limit: 1,
      },
    }

    const invokeResult = {
      cursor: 'cursor',
      events: [
        {
          type: 'busEvent',
        },
      ],
    }
    invokeConsumer.mockImplementation(async () => invokeResult)

    const result = await read(pool, payload)

    expect(invokeConsumer).toHaveBeenCalledWith(
      pool,
      ConsumerMethod.LoadEvents,
      payload.eventFilter
    )
    expect(result).toEqual(invokeResult)
  })

  test('reset', async () => {
    const resultRunQuery = {
      subscriptionId: 'subscriptionId',
      deliveryStrategy: DeliveryStrategy.ACTIVE_XA,
      queueStrategy: QueueStrategy.NONE,
      eventTypes: JSON.stringify({ eventTypes: true }),
      aggregateIds: JSON.stringify({ aggregateIds: true }),
    }
    const pool = {
      database: {
        runQuery: jest.fn(() => [resultRunQuery]),
        runRawQuery: jest.fn(),
        escapeStr,
        escapeId,
        encodeJsonPath: jest.fn((str) => str),
      },
      parseSubscription,
      invokeConsumer,
      generateGuid,
    }
    const payload = {
      eventSubscriber: 'eventSubscriber',
    }

    const result = await reset(pool, payload)

    expect(result).toEqual('subscriptionId')
    expect(pool.database.runQuery).toMatchSnapshot()
    expect(pool.database.runRawQuery).toMatchSnapshot()
    expect(invokeConsumer).toHaveBeenCalledWith(pool, ConsumerMethod.Drop, {
      eventSubscriber: payload.eventSubscriber,
    })
  })

  test('resubscribe', async () => {
    const pool = {
      database: {
        runQuery: jest.fn(() => [{ subscriptionId: 'subscriptionId' }]),
        runRawQuery: jest.fn(),
        escapeStr,
        escapeId,
        encodeJsonPath: jest.fn((str) => str),
      },
      parseSubscription,
      generateGuid,
    }
    const payload = {
      eventSubscriber: 'eventSubscriber',
      subscriptionOptions: {
        deliveryStrategy: DeliveryStrategy.ACTIVE_XA,
      },
    }

    const result = await resubscribe(pool, payload)

    expect(result).toEqual('subscriptionId')
    expect(pool.database.runQuery).toMatchSnapshot()
    expect(pool.database.runRawQuery).toMatchSnapshot()
  })

  test('resume', async () => {
    const pool = {
      database: {
        runQuery: jest.fn(() => [
          {
            status: SubscriptionStatus.DELIVER,
            subscriptionId: 'subscriptionId',
          },
        ]),
        escapeStr,
        escapeId,
      },
      parseSubscription,
      invokeOperation,
    }
    const payload = {
      eventSubscriber: 'eventSubscriber',
    }

    const result = await resume(pool, payload)

    expect(result).toEqual('subscriptionId')
    expect(pool.database.runQuery).toMatchSnapshot()
    expect(invokeOperation).toHaveBeenCalledWith(pool, LazinessStrategy.EAGER, {
      type: PrivateOperationType.RESUME_SUBSCRIBER,
      payload,
    })
  })

  test('status', async () => {
    const resultRunQuery = {
      subscriptionId: 'subscriptionId',
      batchId: 'batchId',
      eventSubscriber: 'eventSubscriber',
      deliveryStrategy: 'deliveryStrategy',
      scopeName: 'scopeName',
      status: 'status',
      maxParallel: 1,
      successEvent: JSON.stringify({
        type: 'busEvent',
      }),
      failedEvent: null,
      errors: null,
      cursor: JSON.stringify({ cursor: 'cursor' }),
    }
    const pool = {
      database: {
        runQuery: jest.fn(() => [resultRunQuery]),
        escapeStr,
        escapeId,
      },
      parseSubscription,
    }
    const payload = {
      eventSubscriber: 'eventSubscriber',
    }

    const result = await status(pool, payload)

    expect(result).toEqual({
      ...resultRunQuery,
      successEvent: {
        type: 'busEvent',
      },
      cursor: { cursor: 'cursor' },
    })
    expect(pool.database.runQuery).toMatchSnapshot()
  })

  test('subscribe', async () => {
    const pool = {
      database: {
        runQuery: jest.fn(() => [
          {
            subscriptionId: 'subscriptionId',
          },
        ]),
        runRawQuery: jest.fn(),
        escapeStr,
        escapeId,
        encodeJsonPath: jest.fn((str) => str),
      },
      parseSubscription,
      generateGuid,
    }
    const payload = {
      eventSubscriber: 'eventSubscriber',
      subscriptionOptions: {
        deliveryStrategy: DeliveryStrategy.ACTIVE_XA,
      },
    }

    const result = await subscribe(pool, payload)

    expect(result).toEqual('subscriptionId')
    expect(pool.database.runQuery).toMatchSnapshot()
    expect(pool.database.runRawQuery).toMatchSnapshot()
  })

  test('unsubscribe', async () => {
    const pool = {
      database: {
        runRawQuery: jest.fn(),
        escapeStr,
        escapeId,
      },
    }
    const payload = {
      eventSubscriber: 'eventSubscriber',
    }

    await unsubscribe(pool, payload)

    expect(pool.database.runRawQuery).toMatchSnapshot()
  })
})

describe('Core operation', () => {
  let DateNow = null
  let MathRandom = null
  beforeAll(() => {
    DateNow = global.Date.now
    global.Date.now = jest.fn(() => 1)
    MathRandom = global.Math.random
    global.Math.random = jest.fn(() => 2)
  })
  afterAll(() => {
    global.Date.now = DateNow
    global.Math.random = MathRandom
  })
  afterEach(() => {
    clearMocks()
  })

  test('push notification', async () => {
    const pool = {
      database: {
        runQuery: jest.fn(() => [
          {
            subscriptionId: 'subscriptionId',
          },
        ]),
        runRawQuery: jest.fn(),
        escapeStr,
        escapeId,
        encodeJsonPath: jest.fn((str) => str),
      },
      invokeOperation,
      invokeConsumer,
      generateGuid,
    }
    const payload = {
      event: {
        type: 'busEvent',
        aggregateId: 'aggregateId',
        aggregateVersion: 'aggregateVersion',
      },
    }

    await pushNotificationAndGetSubscriptions(pool, payload)

    expect(invokeOperation).toHaveBeenCalledWith(pool, LazinessStrategy.EAGER, {
      type: PrivateOperationType.PULL_NOTIFICATIONS,
      payload: {
        subscriptionId: 'subscriptionId',
      },
    })
    expect(pool.database.runQuery).toMatchSnapshot()
    expect(pool.database.runRawQuery).toMatchSnapshot()
  })

  test('pull notifications', async () => {
    const activeBatch = {
      subscriptionId: 'subscriptionId',
      batchId: 'batchId',
      eventSubscriber: 'eventSubscriber',
    }
    const pool = {
      database: {
        runQuery: jest.fn(() => [activeBatch]),
        runRawQuery: jest.fn(),
        escapeStr,
        escapeId,
      },
      parseSubscription,
      invokeOperation,
      generateGuid,
    }
    const payload = { subscriptionId: 'subscriptionId' }

    await pullNotificationsAsBatchForSubscriber(pool, payload)

    expect(invokeOperation).toHaveBeenCalledWith(pool, LazinessStrategy.EAGER, {
      type: PrivateOperationType.DELIVER_BATCH,
      payload: {
        activeBatch: {
          ...activeBatch,
          batchId: expect.any(String),
        },
      },
    })
    expect(pool.database.runQuery).toMatchSnapshot()
    expect(pool.database.runRawQuery).toMatchSnapshot()
  })

  test('acknowledge batch', async () => {
    const result = {
      successEvent: {
        aggregateId: 'aggregateId',
        aggregateVersion: 'aggregateVersion',
      },
      failedEvent: null,
      error: null,
    }
    const pool = {
      database: {
        runQuery: jest.fn(),
        runRawQuery: jest.fn(),
        escapeStr,
        escapeId,
      },
      parseSubscription,
      getNextCursor: jest.fn(() => 'nextCursor'),
      invokeConsumer,
      invokeOperation,
      serializeError,
    }
    const payload = { batchId: 'batchId', result }

    const activeBatch = {
      subscriptionId: 'subscriptionId',
      batchId: 'batchId',
      eventSubscriber: 'eventSubscriber',
    }

    pool.database.runQuery.mockResolvedValueOnce([
      {
        aggregateIdAndVersion: 'aggregateId:aggregateVersion',
      },
    ])

    pool.database.runQuery.mockResolvedValueOnce([
      {
        ...activeBatch,
        deliveryStrategy: DeliveryStrategy.ACTIVE_XA,
        cursor: JSON.stringify({ cursor: 'cursor' }),
        xaTransactionId: JSON.stringify({ xaTransactionId: 'xaTransactionId' }),
        runStatus: NotificationStatus.PROCESSING,
      },
    ])

    pool.database.runQuery.mockResolvedValueOnce([{}])

    await acknowledgeBatch(pool, payload)

    expect(invokeOperation).toHaveBeenCalledWith(pool, LazinessStrategy.EAGER, {
      type: PrivateOperationType.FINALIZE_BATCH,
      payload: {
        activeBatch,
        result: {
          ...result,
          cursor: 'nextCursor',
        },
      },
    })
    expect(pool.database.runQuery).toMatchSnapshot()
    expect(pool.database.runRawQuery).toMatchSnapshot()
  })

  test('resume subscriber', async () => {
    const pool = {
      database: {
        runQuery: jest.fn(() => [
          { subscriptionId: 'subscriptionId', status: 'deliver' },
        ]),
        runRawQuery: jest.fn(),
        escapeStr,
        escapeId,
      },
      invokeOperation,
      generateGuid,
    }
    const payload = {
      eventSubscriber: 'eventSubscriber',
    }

    await resumeSubscriber(pool, payload)

    expect(invokeOperation).toHaveBeenCalledWith(pool, LazinessStrategy.EAGER, {
      type: PrivateOperationType.PULL_NOTIFICATIONS,
      payload: {
        subscriptionId: 'subscriptionId',
      },
    })
    expect(pool.database.runQuery).toMatchSnapshot()
    expect(pool.database.runRawQuery).toMatchSnapshot()
  })

  test('finalize batch', async () => {
    const result = {
      successEvent: {
        aggregateId: 'aggregateId',
        aggregateVersion: 'aggregateVersion',
      },
      failedEvent: null,
      error: null,
    }
    const activeBatch = {
      subscriptionId: 'subscriptionId',
      batchId: 'batchId',
      eventSubscriber: 'eventSubscriber',
    }
    const pool = {
      database: {
        runQuery: jest.fn(() => [{ subscriptionId: 'subscriptionId' }]),
        runRawQuery: jest.fn(),
        escapeStr,
        escapeId,
      },
      invokeOperation,
    }
    const payload = {
      activeBatch,
      result,
    }

    await finalizeAndReportBatch(pool, payload)

    expect(invokeOperation).toHaveBeenCalledWith(pool, LazinessStrategy.EAGER, {
      type: PrivateOperationType.RESUME_SUBSCRIBER,
      payload: {
        eventSubscriber: 'eventSubscriber',
        conditionalResume: true,
      },
    })
    expect(pool.database.runQuery).toMatchSnapshot()
    expect(pool.database.runRawQuery).toMatchSnapshot()
  })

  test('request timeout', async () => {
    const pool = {
      database: {
        runQuery: jest.fn(),
        runRawQuery: jest.fn(),
        escapeStr,
        escapeId,
      },
      parseSubscription,
      invokeConsumer,
      invokeOperation,
      getNextCursor: jest.fn(() => 'nextCursor'),
      serializeError,
    }
    const payload = {
      batchId: 'batchId',
    }

    const activeBatch = {
      subscriptionId: 'subscriptionId',
      batchId: 'batchId',
      eventSubscriber: 'eventSubscriber',
    }

    pool.database.runQuery.mockResolvedValueOnce([
      {
        ...activeBatch,
        deliveryStrategy: DeliveryStrategy.ACTIVE_XA,
        cursor: JSON.stringify({ cursor: 'cursor' }),
        xaTransactionId: JSON.stringify({ xaTransactionId: 'xaTransactionId' }),
        runStatus: NotificationStatus.PROCESSING,
      },
    ])

    pool.database.runQuery.mockResolvedValueOnce([{}])

    invokeConsumer.mockResolvedValueOnce('1')

    const event = {
      aggregateIdAndVersion: 'aggregateId:aggregateVersion',
    }

    pool.database.runQuery.mockResolvedValueOnce([event])

    await requestTimeout(pool, payload)

    expect(invokeOperation).toHaveBeenCalledWith(pool, LazinessStrategy.EAGER, {
      type: PrivateOperationType.FINALIZE_BATCH,
      payload: {
        activeBatch,
        result: {
          error: null,
          successEvent: event,
          cursor: 'nextCursor',
        },
      },
    })
    expect(pool.database.runQuery).toMatchSnapshot()
    expect(pool.database.runRawQuery).toMatchSnapshot()
  })
})
