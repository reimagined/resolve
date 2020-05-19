import {
  DELIVERY_STRATEGY_ACTIVE_NONE,
  DELIVERY_STRATEGY_ACTIVE_REGULAR,
  DELIVERY_STRATEGY_ACTIVE_XA,
  DELIVERY_STRATEGY_PASSIVE,
  SUBSCRIBER_OPTIONS_PARSE_SYMBOL,
  STATUS_DELIVER,
  STATUS_ERROR,
  NOTIFICATIONS_TABLE_NAME,
  BATCHES_TABLE_NAME
} from '../constants'

const deliverBatchForSubscriber = async (pool, subscriptionDescription) => {
  const {
    database: { runRawQuery, escapeId, escapeStr },
    getSubscriberOptions,
    requestTimeout,
    finalizeAndReportBatch,
    serializeError,
    multiplexAsync,
    consumer
  } = pool
  const { batchId, ...subscriptionOptions } = subscriptionDescription
  const {
    subscriptionId,
    eventSubscriber,
    deliveryStrategy,
    eventTypes,
    aggregateIds,
    successEvent,
    failedEvent,
    errors,
    cursor
  } = await getSubscriberOptions(
    pool,
    SUBSCRIBER_OPTIONS_PARSE_SYMBOL,
    subscriptionOptions
  )

  if (
    deliveryStrategy !== DELIVERY_STRATEGY_ACTIVE_NONE &&
    deliveryStrategy !== DELIVERY_STRATEGY_ACTIVE_REGULAR &&
    deliveryStrategy !== DELIVERY_STRATEGY_ACTIVE_XA &&
    deliveryStrategy !== DELIVERY_STRATEGY_PASSIVE
  ) {
    throw new Error(`Wrong deliveryStrategy="${deliveryStrategy}"`)
  }

  if (deliveryStrategy === DELIVERY_STRATEGY_PASSIVE) {
    multiplexAsync(consumer.sendEvents.bind(consumer), eventSubscriber, {
      batchId,
      events: null,
      properties: null
    })

    await finalizeAndReportBatch(pool, subscriptionDescription, STATUS_DELIVER)

    return
  }
  const isEventBasedRun = successEvent != null || failedEvent != null
  let [events, xaTransactionId] = [null, null]

  if (isEventBasedRun) {
    const notificationsTableNameAsId = escapeId(NOTIFICATIONS_TABLE_NAME)
    const batchesTableNameAsId = escapeId(BATCHES_TABLE_NAME)

    try {
      const xaTransactionIdPromise =
        deliveryStrategy === DELIVERY_STRATEGY_ACTIVE_XA
          ? consumer.beginXATransaction(batchId, eventSubscriber)
          : Promise.resolve(null)

      void ({ events } = await consumer.loadEvents({
        eventTypes,
        aggregateIds,
        limit: 200, // TODO: pass limit from subscription options
        cursor
      }))

      if (events.length === 0) {
        await finalizeAndReportBatch(
          pool,
          subscriptionDescription,
          STATUS_DELIVER
        )
        return
      }

      xaTransactionId = await xaTransactionIdPromise

      if (
        deliveryStrategy === DELIVERY_STRATEGY_ACTIVE_XA &&
        xaTransactionId == null
      ) {
        throw new Error(`Failed to start XA session`)
      }
    } catch (error) {
      await finalizeAndReportBatch(
        pool,
        subscriptionDescription,
        STATUS_ERROR,
        {
          error: serializeError(error)
        }
      )

      return
    }

    await runRawQuery(`
      ${
        events.length > 0
          ? `INSERT INTO ${batchesTableNameAsId}(
            "batchId",
            "eventIndex",
            "threadId",
            "threadCounter",
            "aggregateIdAndVersion"
          ) VALUES
        ${events
          .map(
            ({ threadId, threadCounter, aggregateId, aggregateVersion }, idx) =>
              `(${escapeStr(
                batchId
              )}, ${+idx}, ${+threadId}, ${+threadCounter}, ${escapeStr(
                `${aggregateId}:${aggregateVersion}`
              )})`
          )
          .join(', ')};
        `
          : ''
      }

      ${
        xaTransactionId != null
          ? `UPDATE ${notificationsTableNameAsId} SET "xaTransactionId" =
      ${xaTransactionId != null ? escapeStr(xaTransactionId) : 'NULL'}
      WHERE "subscriptionId" = ${escapeStr(subscriptionId)};    `
          : ''
      }
      
      COMMIT;
      BEGIN IMMEDIATE;
    `)
  } else {
    // TODO: improve Inital event timestamp for sagas
    let initialEvent = null
    try {
      initialEvent = (
        await consumer.loadEvents({
          eventTypes,
          aggregateIds,
          limit: 1,
          cursor: null
        })
      ).events[0]
    } catch (error) {
      await finalizeAndReportBatch(
        pool,
        subscriptionDescription,
        STATUS_ERROR,
        {
          error: serializeError(error)
        }
      )

      return
    }

    events = [
      {
        timestamp: initialEvent != null ? initialEvent.timestamp : 0,
        type: 'Init'
      }
    ]
  }

  multiplexAsync(consumer.sendEvents.bind(consumer), eventSubscriber, {
    batchId,
    xaTransactionId,
    events,
    properties: null
  })

  multiplexAsync(requestTimeout, pool, batchId)
}

export default deliverBatchForSubscriber
