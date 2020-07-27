import {
  NOTIFICATIONS_TABLE_NAME,
  SUBSCRIBERS_TABLE_NAME,
  DeliveryStrategy,
  ConsumerMethod,
  LazinessStrategy,
  PrivateOperationType,
  NotificationStatus,
  SubscriptionStatus,
  BATCH_CONSUMING_TIME
} from '../constants'
const deliverBatchForSubscriber = async (pool, payload) => {
  const {
    database: { runRawQuery, runQuery, escapeStr, escapeId, decodeJsonPath },
    parseSubscription,
    invokeConsumer,
    invokeOperation,
    serializeError,
  } = pool
  const { activeBatch } = payload
  const { batchId, subscriptionId, eventSubscriber } = activeBatch

  const subscribersTableNameAsId = escapeId(SUBSCRIBERS_TABLE_NAME)
  const notificationsTableNameAsId = escapeId(NOTIFICATIONS_TABLE_NAME)

  const result = await runQuery(`
    SELECT ${subscribersTableNameAsId}."eventTypes" AS "eventTypes",
    ${subscribersTableNameAsId}."aggregateIds" AS "aggregateIds",
    ${subscribersTableNameAsId}."status" AS "status",
    ${subscribersTableNameAsId}."deliveryStrategy" AS "deliveryStrategy",
    ${subscribersTableNameAsId}."queueStrategy" AS "queueStrategy",
    ${subscribersTableNameAsId}."properties" AS "properties",
    ${subscribersTableNameAsId}."cursor" AS "cursor",
    ${notificationsTableNameAsId}."status" AS "runStatus",
    ${notificationsTableNameAsId}."xaTransactionId" AS "xaTransactionId",
    (${subscribersTableNameAsId}."successEvent" IS NOT NULL OR
    ${subscribersTableNameAsId}."failedEvent" IS NOT NULL
    ${subscribersTableNameAsId}."cursor" IS NOT NULL) AS "isEventBasedRun",
    ${subscribersTableNameAsId}."status" AS "status",
    ${subscribersTableNameAsId}."errors" IS NOT NULL AS "hasErrors"
    FROM ${notificationsTableNameAsId} LEFT JOIN ${subscribersTableNameAsId}
    ON ${subscribersTableNameAsId}."subscriptionId" = 
    ${notificationsTableNameAsId}."subscriptionId"
    WHERE ${subscribersTableNameAsId}."subscriptionId" = ${escapeStr(
    subscriptionId
  )}
    LIMIT 1
  `)
  if (result == null || result.length !== 1) {
    throw new Error('Cannot retrieve subscriber information')
  }
  const {
    eventTypes,
    aggregateIds,
    deliveryStrategy,
    cursor,
    runStatus,
    xaTransactionId: existingXaTransactionId,
    properties,
    isEventBasedRun,
    status,
    hasErrors
  } = await parseSubscription(result[0])
  if (status === SubscriptionStatus.ERROR || hasErrors) {
    const input = {
      type: PrivateOperationType.FINALIZE_BATCH,
      payload: {
        activeBatch,
        result: null
      }
    }
    await invokeOperation(pool, LazinessStrategy.EAGER, input)
    return
  }
  if (
    deliveryStrategy !== DeliveryStrategy.ACTIVE_NONE &&
    deliveryStrategy !== DeliveryStrategy.ACTIVE_REGULAR &&
    deliveryStrategy !== DeliveryStrategy.ACTIVE_XA &&
    deliveryStrategy !== DeliveryStrategy.PASSIVE
  ) {
    throw new Error(`Wrong deliveryStrategy="${deliveryStrategy}"`)
  }
  if (deliveryStrategy === DeliveryStrategy.PASSIVE) {
    await invokeConsumer(pool, ConsumerMethod.SendEvents, {
      eventSubscriber,
      events: null,
      batchId
    })
    const input = {
      type: PrivateOperationType.FINALIZE_BATCH,
      payload: {
        activeBatch,
        result: null
      }
    }
    await invokeOperation(pool, LazinessStrategy.EAGER, input)
    return
  }

  let xaTransactionId = existingXaTransactionId

  if (runStatus !== NotificationStatus.PROCESSING) {
    if (isEventBasedRun && deliveryStrategy === DeliveryStrategy.ACTIVE_XA) {
      try {
        if (xaTransactionId == null) {
          xaTransactionId = await invokeConsumer(
            pool,
            ConsumerMethod.BeginXATransaction,
            {
              eventSubscriber,
              batchId
            }
          )
        }
        if (xaTransactionId == null) {
          throw new Error(`Failed to start XA session`)
        }
      } catch (error) {
        const input = {
          type: PrivateOperationType.FINALIZE_BATCH,
          payload: {
            activeBatch,
            result: {
              error: serializeError(error)
            }
          }
        }
        await invokeOperation(pool, LazinessStrategy.EAGER, input)
        return
      }
    }

    await runRawQuery(`
      UPDATE ${notificationsTableNameAsId} SET 
      ${isEventBasedRun ? `"xaTransactionId" = json(${escapeStr(JSON.stringify(xaTransactionId))}),` : ''}
      "status" = ${escapeStr(NotificationStatus.PROCESSING)}
      WHERE "batchId" = ${escapeStr(batchId)};
      
      COMMIT;
      BEGIN IMMEDIATE;
    `)
  }

  if (runStatus === NotificationStatus.RECIEVED) {
    await runRawQuery(`
      UPDATE ${notificationsTableNameAsId}
      SET "status" = ${escapeStr(NotificationStatus.PROCESSING)}
      WHERE "batchId" = ${escapeStr(batchId)};
      
      COMMIT;
      BEGIN IMMEDIATE;
  `)

    const sendingProperties =
      properties != null
        ? Object.keys(properties).reduce((acc, key) => {
          acc[decodeJsonPath(key)] = properties[key]
          return acc
        }, {})
        : {}

    await invokeConsumer(
      pool,
      ConsumerMethod.SendEvents,
      {
        xaTransactionId,
        eventSubscriber,
        deliveryStrategy,
        cursor,
        eventTypes,
        aggregateIds,
        properties: sendingProperties,
        batchId
      },
      true
    )
  }

  const input = {
    type: PrivateOperationType.REQUEST_TIMEOUT,
    payload: { batchId }
  }

  await invokeOperation(
    pool,
    LazinessStrategy.LAZY,
    input,
    BATCH_CONSUMING_TIME
  )
}

export default deliverBatchForSubscriber
