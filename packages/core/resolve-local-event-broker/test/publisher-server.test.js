import SQLite from 'sqlite'
import fs from 'fs'
import os from 'os'
import tmp from 'tmp'

import connectDatabase from '../src/publisher-server/connect-database'
import finalizeAndReportBatch from '../src/publisher-server/core/finalize-and-report-batch'
import pullNotificationsAsBatchForSubscriber from '../src/publisher-server/core/pull-notifications-as-batch-for-subscriber'
import pushNotificationAndGetSubscriptions from '../src/publisher-server/core/push-notification-and-get-subscriptions'
import manageSubscription from '../src/publisher-server/core/manage-subscription'
import getSubscriberOptions from '../src/publisher-server/core/get-subscriber-options'
import requestTimeout from '../src/publisher-server/core/request-timeout'
import ensureOrResetSubscription from '../src/publisher-server/core/ensure-or-reset-subscription'
import deliverBatchForSubscriber from '../src/publisher-server/core/deliver-batch-for-subscriber'
import acknowledgeBatch from '../src/publisher-server/core/acknowledge-batch'
import * as constants from '../src/publisher-server/constants'

const escapeId = str => `"${String(str).replace(/(["])/gi, '$1$1')}"`

const escapeStr = str => `'${String(str).replace(/(['])/gi, '$1$1')}'`

describe('finalize and report batch', () => {
  let pool = null
  beforeEach(() => {
    pool = {
      database: {
        escapeId,
        escapeStr,
        runQuery: jest.fn(),
        runRawQuery: jest.fn()
      },
      serializeError: jest.fn(),
      pushNotificationAndGetSubscriptions: jest.fn(),
      pullNotificationsAsBatchForSubscriber: jest.fn(),
      multiplexAsync: jest.fn()
    }
  })

  test('should call function with status "deliver"', async () => {
    await finalizeAndReportBatch(
      pool,
      {
        batchId: 'batchId',
        subscriptionId: 'subscriptionId',
        eventSubscriber: 'eventSubscriber'
      },
      constants.STATUS_DELIVER,
      {
        successEvent: {}
      }
    )

    expect(pool.database.runQuery).toMatchSnapshot()
    expect(pool.database.runRawQuery).toMatchSnapshot()
    expect(pool.pushNotificationAndGetSubscriptions).toHaveBeenCalled()
  })

  test('should call function with status "skip"', async () => {
    await finalizeAndReportBatch(
      pool,
      {
        batchId: 'batchId',
        subscriptionId: 'subscriptionId',
        eventSubscriber: 'eventSubscriber'
      },
      constants.STATUS_SKIP,
      {
        successEvent: {}
      }
    )

    expect(pool.database.runQuery).toMatchSnapshot()
    expect(pool.database.runRawQuery).toMatchSnapshot()
    expect(pool.pushNotificationAndGetSubscriptions).not.toHaveBeenCalled()
  })
})

describe('pull notifications as batch for subscriber', () => {
  let pool = null
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
  beforeEach(() => {
    pool = {
      database: {
        runRawQuery: jest.fn(),
        runQuery: jest.fn(),
        escapeStr,
        escapeId
      },
      deliverBatchForSubscriber: jest.fn()
    }
  })

  test('should affected notifications is null', async () => {
    await pullNotificationsAsBatchForSubscriber(pool, 'subscriptionId')

    expect(pool.database.runQuery).toMatchSnapshot()
    expect(pool.database.runRawQuery).toMatchSnapshot()
    expect(pool.deliverBatchForSubscriber).not.toHaveBeenCalled()
  })

  test('should affected notifications not null', async () => {
    pool.database.runQuery = jest.fn(() => [''])
    await pullNotificationsAsBatchForSubscriber(pool, 'subscriptionId')

    expect(pool.database.runQuery).toMatchSnapshot()
    expect(pool.database.runRawQuery).toMatchSnapshot()
    expect(pool.deliverBatchForSubscriber).toHaveBeenCalled()
  })
})

describe('push notification and get subscriptions', () => {
  let pool = null
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
  beforeEach(() => {
    pool = {
      database: {
        runRawQuery: jest.fn(),
        runQuery: jest.fn(() => [
          {
            subscriptionId: 'subscriptionId'
          }
        ]),
        escapeStr,
        escapeId,
        encodeJsonPath: jest.fn(str => str)
      }
    }
  })

  test('should execute with "event" mode', async () => {
    await pushNotificationAndGetSubscriptions(
      pool,
      constants.NOTIFICATION_EVENT_SYMBOL,
      {
        type: 'type',
        aggregateId: 'aggregateId',
        aggregateVersion: 'aggregateVersion'
      }
    )

    expect(pool.database.runQuery).toMatchSnapshot()
    expect(pool.database.runRawQuery).toMatchSnapshot()
    expect(pool.eventStore.saveEvent).toHaveBeenCalledWith({
      type: 'type',
      aggregateId: 'aggregateId',
      aggregateVersion: 'aggregateVersion'
    })
  })

  test('should execute with "update" mode', async () => {
    await pushNotificationAndGetSubscriptions(
      pool,
      constants.NOTIFICATION_UPDATE_SYMBOL,
      'eventSubscriber'
    )

    expect(pool.database.runQuery).toMatchSnapshot()
    expect(pool.database.runRawQuery).toMatchSnapshot()
    expect(pool.eventStore.saveEvent).not.toHaveBeenCalled()
  })
})

describe('manage subscription', () => {
  let pool = null
  beforeEach(() => {
    pool = {
      database: {
        escapeId,
        escapeStr,
        runQuery: jest.fn(() => [{ subscriptionId: 'subscriptionId' }]),
        runRawQuery: jest.fn()
      },
      pushNotificationAndGetSubscriptions: jest.fn(() => ['']),
      pullNotificationsAsBatchForSubscriber: jest.fn(),
      multiplexAsync: jest.fn()
    }
  })

  test('should execute with "resume" mode', async () => {
    await manageSubscription(pool, constants.RESUME_SYMBOL, 'eventSubscriber')

    expect(pool.database.runQuery).toMatchSnapshot()
    expect(pool.database.runRawQuery).toMatchSnapshot()
    expect(pool.multiplexAsync).toHaveBeenCalled()
  })

  test('should execute with "pause" mode', async () => {
    await manageSubscription(pool, constants.PAUSE_SYMBOL, 'eventSubscriber')

    expect(pool.database.runQuery).toMatchSnapshot()
    expect(pool.database.runRawQuery).toMatchSnapshot()
    expect(pool.multiplexAsync).not.toHaveBeenCalled()
  })
})

describe('get subscriber options', () => {
  let pool = null
  beforeEach(() => {
    pool = {
      database: {
        escapeId,
        escapeStr,
        runQuery: jest.fn(() => [
          {
            eventSubscriber: 'eventSubscriber',
            subscriptionId: 'subscriptionId'
          }
        ]),
        decodeJsonPath: jest.fn(str => str)
      }
    }
  })

  test('should execute with "fetch" mode', async () => {
    const subscriberOptions = await getSubscriberOptions(
      pool,
      constants.SUBSCRIBER_OPTIONS_FETCH_SYMBOL,
      'eventSubscriber',
      ['eventSubscriber']
    )

    expect(pool.database.runQuery).toMatchSnapshot()
    expect(subscriberOptions).toEqual({
      eventSubscriber: 'eventSubscriber'
    })
  })

  test('should execute with "parse" mode', async () => {
    const subscriberOptions = await getSubscriberOptions(
      pool,
      constants.SUBSCRIBER_OPTIONS_PARSE_SYMBOL,
      {
        eventSubscriber: 'eventSubscriber',
        subscriptionId: 'subscriptionId'
      }
    )

    expect(pool.database.runQuery).not.toHaveBeenCalled()
    expect(subscriberOptions).toEqual({
      eventSubscriber: 'eventSubscriber',
      subscriptionId: 'subscriptionId'
    })
  })
})

describe('request timeout', () => {
  let pool = null
  let SetTimeout = null
  beforeAll(() => {
    SetTimeout = global.setTimeout
    global.setTimeout = jest.fn().mockImplementation(promise => {
      promise()
    })
  })
  afterAll(() => {
    global.setTimeout = SetTimeout
  })
  beforeEach(() => {
    pool = {
      database: {
        escapeId,
        escapeStr,
        runQuery: jest.fn(),
        runRawQuery: jest.fn()
      },
      consumer: {
        commitXATransaction: jest.fn(),
        rollbackXATransaction: jest.fn()
      },
      finalizeAndReportBatch: jest.fn(),
      acknowledgeBatch: jest.fn()
    }
  })

  test('should execute with "active-xa" delivery strategy', async () => {
    pool.database.runQuery.mockResolvedValueOnce([
      {
        deliveryStrategy: constants.DELIVERY_STRATEGY_ACTIVE_XA,
        xaTransactionId: 'xaTransactionId',
        eventSubscriber: 'eventSubscriber',
        status: 'status'
      }
    ])

    pool.consumer.commitXATransaction.mockResolvedValueOnce(1)

    pool.database.runQuery.mockResolvedValueOnce([{}])

    await requestTimeout(pool, 'batchId')

    expect(pool.database.runQuery).toMatchSnapshot()
    expect(pool.database.runRawQuery).toMatchSnapshot()
    expect(pool.acknowledgeBatch).toHaveBeenCalledWith(pool, 'batchId', {
      successEvent: {}
    })
  })

  test('should execute with "passive" delivery strategy', async () => {
    pool.database.runQuery.mockResolvedValueOnce([
      {
        deliveryStrategy: constants.DELIVERY_STRATEGY_PASSIVE,
        xaTransactionId: 'xaTransactionId',
        eventSubscriber: 'eventSubscriber',
        status: 'status'
      }
    ])

    await expect(requestTimeout(pool, 'batchId')).rejects.toThrowError(
      'Request timeout should not be activated for passive mode'
    )

    expect(pool.database.runQuery).toMatchSnapshot()
    expect(pool.database.runRawQuery).not.toHaveBeenCalled()
    expect(pool.acknowledgeBatch).not.toHaveBeenCalled()
  })
})

describe('ensure or reset subscription', () => {
  let pool = null
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
  beforeEach(() => {
    pool = {
      database: {
        runQuery: jest.fn(() => [
          {
            subscriptionId: 'subscriptionId'
          }
        ]),
        runRawQuery: jest.fn(),
        escapeId,
        escapeStr,
        encodeJsonPath: jest.fn(str => str)
      }
    }
  })

  test('should execute with "unsubscribe" mode', async () => {
    await ensureOrResetSubscription(
      pool,
      constants.UNSUBSCRIBE_SYMBOL,
      'eventSubscriber'
    )

    expect(pool.database.runQuery).toMatchSnapshot()
    expect(pool.database.runRawQuery).toMatchSnapshot()
  })

  test('should execute with "subscribe" mode', async () => {
    const subscriptionId = await ensureOrResetSubscription(
      pool,
      constants.SUBSCRIBE_SYMBOL,
      'eventSubscriber',
      {
        deliveryStrategy: constants.DELIVERY_STRATEGY_PASSIVE,
        eventTypes: ['eventType'],
        aggregateIds: ['aggregateId']
      }
    )

    expect(pool.database.runQuery).toMatchSnapshot()
    expect(pool.database.runRawQuery).toMatchSnapshot()
    expect(subscriptionId).toEqual('subscriptionId')
  })

  test('should execute with "resubscribe" mode', async () => {
    const subscriptionId = await ensureOrResetSubscription(
      pool,
      constants.RESUBSCRIBE_SYMBOL,
      'eventSubscriber',
      {
        deliveryStrategy: constants.DELIVERY_STRATEGY_PASSIVE,
        eventTypes: ['eventType'],
        aggregateIds: ['aggregateId']
      }
    )

    expect(pool.database.runQuery).toMatchSnapshot()
    expect(pool.database.runRawQuery).toMatchSnapshot()
    expect(subscriptionId).toEqual('eventSubscriber12')
  })
})

describe('deliver batch for subscriber', () => {
  let pool = null
  const subscriptionDescription = {
    batchId: 'batchId'
  }
  const events = [
    {
      threadId: 'threadId',
      threadCounter: 1,
      aggregateId: 'aggregateId',
      aggregateVersion: 1,
      timestamp: 1
    }
  ]
  beforeEach(() => {
    pool = {
      database: { runRawQuery: jest.fn(), escapeId, escapeStr },
      getSubscriberOptions: jest.fn(),
      requestTimeout: jest.fn(),
      finalizeAndReportBatch: jest.fn(),
      serializeError: jest.fn(),
      multiplexAsync: jest.fn(),
      consumer: {
        sendEvents: jest.fn(),
        beginXATransaction: jest.fn(() => 'transactionId')
      }
    }
  })

  test('should execute with "passive" delivery strategy', async () => {
    pool.getSubscriberOptions.mockResolvedValueOnce({
      deliveryStrategy: constants.DELIVERY_STRATEGY_PASSIVE,
      eventSubscriber: 'eventSubscriber'
    })

    await deliverBatchForSubscriber(pool, subscriptionDescription)

    expect(pool.multiplexAsync).toHaveBeenCalledWith(
      expect.any(Function),
      'eventSubscriber',
      {
        batchId: 'batchId',
        events: null,
        properties: null
      }
    )
    expect(pool.finalizeAndReportBatch).toHaveBeenCalledWith(
      pool,
      subscriptionDescription,
      constants.STATUS_DELIVER
    )
  })

  test('should event based run', async () => {
    pool.getSubscriberOptions.mockResolvedValueOnce({
      subscriptionId: 'subscriptionId',
      deliveryStrategy: constants.DELIVERY_STRATEGY_ACTIVE_XA,
      eventSubscriber: 'eventSubscriber',
      successEvent: {}
    })

    await deliverBatchForSubscriber(pool, subscriptionDescription)

    expect(pool.consumer.beginXATransaction).toHaveBeenCalledWith(
      'batchId',
      'eventSubscriber'
    )
    expect(pool.database.runRawQuery).toMatchSnapshot()
    expect(pool.multiplexAsync).toHaveBeenNthCalledWith(
      1,
      expect.any(Function),
      'eventSubscriber',
      {
        batchId: 'batchId',
        transactionId: 'transactionId',
        events,
        properties: null
      }
    )
    expect(pool.multiplexAsync).toHaveBeenNthCalledWith(
      2,
      expect.any(Function),
      pool,
      'batchId'
    )
  })

  test('should initial event run', async () => {
    pool.getSubscriberOptions.mockResolvedValueOnce({
      subscriptionId: 'subscriptionId',
      deliveryStrategy: constants.DELIVERY_STRATEGY_ACTIVE_XA,
      eventSubscriber: 'eventSubscriber'
    })

    await deliverBatchForSubscriber(pool, subscriptionDescription)

    expect(pool.consumer.beginXATransaction).not.toHaveBeenCalled()
    expect(pool.database.runRawQuery).not.toHaveBeenCalled()
    expect(pool.multiplexAsync).toHaveBeenNthCalledWith(
      1,
      expect.any(Function),
      'eventSubscriber',
      {
        batchId: 'batchId',
        transactionId: null,
        events: [
          {
            type: 'Init',
            timestamp: 1
          }
        ],
        properties: null
      }
    )
    expect(pool.multiplexAsync).toHaveBeenNthCalledWith(
      2,
      expect.any(Function),
      pool,
      'batchId'
    )
  })
})

describe('acknowledge batch', () => {
  let pool = null
  const subscriptionDescription = {
    cursor: 'cursor',
    xaTransactionId: 'xaTransactionId',
    status: 'status',
    deliveryStrategy: constants.DELIVERY_STRATEGY_ACTIVE_XA,
    eventSubscriber: 'eventSubscriber'
  }
  beforeEach(() => {
    pool = {
      database: {
        runRawQuery: jest.fn(),
        runQuery: jest.fn(),
        escapeId,
        escapeStr
      },
      getNextCursor: jest.fn(() => 'nextCursor'),
      finalizeAndReportBatch: jest.fn(),
      consumer: {
        commitXATransaction: jest.fn(),
        rollbackXATransaction: jest.fn()
      }
    }
  })

  test('should commit transaction', async () => {
    pool.database.runQuery.mockResolvedValueOnce([
      {
        aggregateIdAndVersion: 'aggregateId:aggregateVersion'
      }
    ])
    pool.database.runQuery.mockResolvedValueOnce([subscriptionDescription])

    await acknowledgeBatch(pool, 'batchId', {
      successEvent: {
        aggregateId: 'aggregateId',
        aggregateVersion: 'aggregateVersion'
      },
      failedEvent: null,
      error: null
    })

    expect(pool.database.runRawQuery).toMatchSnapshot()
    expect(pool.consumer.commitXATransaction).toHaveBeenCalledWith(
      'eventSubscriber',
      {
        xaTransactionId: 'xaTransactionId',
        batchId: 'batchId'
      }
    )
    expect(pool.finalizeAndReportBatch).toHaveBeenCalledWith(
      pool,
      subscriptionDescription,
      constants.STATUS_DELIVER,
      {
        cursor: 'nextCursor',
        successEvent: {
          aggregateId: 'aggregateId',
          aggregateVersion: 'aggregateVersion'
        },
        failedEvent: null,
        error: null
      }
    )
  })

  test('should rollback transaction', async () => {
    subscriptionDescription.status = constants.STATUS_XA_PREPARE_NOTIFICATION
    pool.database.runQuery.mockResolvedValueOnce([
      {
        aggregateIdAndVersion: 'aggregateId:aggregateVersion'
      }
    ])
    pool.database.runQuery.mockResolvedValueOnce([subscriptionDescription])

    await acknowledgeBatch(pool, 'batchId', {
      successEvent: {
        aggregateId: 'aggregateId',
        aggregateVersion: 'aggregateVersion'
      },
      failedEvent: null,
      error: null
    })

    expect(pool.database.runRawQuery).not.toHaveBeenCalled()
    expect(pool.consumer.rollbackXATransaction).toHaveBeenCalledWith(
      'eventSubscriber',
      {
        xaTransactionId: 'xaTransactionId',
        batchId: 'batchId'
      }
    )
    expect(pool.finalizeAndReportBatch).toHaveBeenCalledWith(
      pool,
      subscriptionDescription,
      constants.STATUS_ERROR,
      {
        error: new Error('Finalizing batch in XA session failed')
      }
    )
  })
})

test('should connect database', async () => {
  const imports = { SQLite, fs, os, tmp }
  const database = await connectDatabase(imports, {
    databaseFile: ':memory:'
  })

  expect(database).toEqual({
    runRawQuery: expect.any(Function),
    runQuery: expect.any(Function),
    dispose: expect.any(Function),
    encodeJsonPath: expect.any(Function),
    decodeJsonPath: expect.any(Function),
    escapeId: expect.any(Function),
    escapeStr: expect.any(Function)
  })
})
