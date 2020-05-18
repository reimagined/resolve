import {
  BATCH_CONSUMING_TIME,
  NOTIFICATIONS_TABLE_NAME,
  SUBSCRIBERS_TABLE_NAME,
  BATCHES_TABLE_NAME,
  STATUS_XA_PREPARE_NOTIFICATION,
  DELIVERY_STRATEGY_ACTIVE_XA,
  DELIVERY_STRATEGY_PASSIVE,
  STATUS_ERROR
} from '../constants'

const requestTimeout = async (pool, batchId) => {
  const {
    database: { escapeId, escapeStr, runQuery, runRawQuery },
    consumer,
    finalizeAndReportBatch,
    acknowledgeBatch
  } = pool
  const notificationsTableNameAsId = escapeId(NOTIFICATIONS_TABLE_NAME)
  const subscribersTableNameAsId = escapeId(SUBSCRIBERS_TABLE_NAME)
  const batchesTableNameAsId = escapeId(BATCHES_TABLE_NAME)
  await new Promise(resolve => setTimeout(resolve, BATCH_CONSUMING_TIME))

  const affectedNotifications = await runQuery(`
    SELECT * FROM ${notificationsTableNameAsId}
    LEFT JOIN ${subscribersTableNameAsId}
    ON ${subscribersTableNameAsId}."subscriptionId" = 
    ${notificationsTableNameAsId}."subscriptionId"
    WHERE ${notificationsTableNameAsId}."batchId" = ${escapeStr(batchId)}
    LIMIT 1
  `)

  if (affectedNotifications == null || affectedNotifications.length === 0) {
    return
  }

  const subscriptionDescription = affectedNotifications[0]
  const {
    deliveryStrategy,
    xaTransactionId,
    eventSubscriber,
    status
  } = subscriptionDescription

  if (deliveryStrategy === DELIVERY_STRATEGY_PASSIVE) {
    throw new Error(`Request timeout should not be activated for passive mode`)
  }

  if (
    deliveryStrategy !== DELIVERY_STRATEGY_ACTIVE_XA ||
    (deliveryStrategy === DELIVERY_STRATEGY_ACTIVE_XA &&
      status === STATUS_XA_PREPARE_NOTIFICATION)
  ) {
    await finalizeAndReportBatch(pool, subscriptionDescription, STATUS_ERROR, {
      error: new Error(`Timeout after ${BATCH_CONSUMING_TIME} ms`)
    })

    return
  }

  await runRawQuery(`
    UPDATE ${notificationsTableNameAsId} SET
    "status" = ${escapeStr(STATUS_XA_PREPARE_NOTIFICATION)}
    WHERE "batchId" = ${batchId};

    COMMIT;
    BEGIN IMMEDIATE;
  `)

  try {
    const appliedEventCount = await consumer.commitXATransaction(
      eventSubscriber,
      { xaTransactionId, batchId, countEvents: true }
    )

    const [successEvent] =
      appliedEventCount > 0
        ? await runQuery(`
        SELECT * FROM ${batchesTableNameAsId}
        WHERE "batchId" = ${escapeStr(batchId)}
        ORDER BY "eventIndex" ASC
        LIMIT ${+appliedEventCount + 1}, 1
      `)
        : [null]

    await acknowledgeBatch(pool, batchId, { successEvent })
  } catch (commitError) {
    const error = new Error(commitError.message)
    error.stack = commitError.stack

    try {
      await consumer.rollbackXATransaction(eventSubscriber, {
        xaTransactionId,
        batchId
      })
    } catch (rollbackError) {
      error.message = `${error.message}\n${rollbackError.message}`
      error.stack = `${error.stack}\n${rollbackError.stack}`
    }

    await acknowledgeBatch(pool, batchId, {
      successEvent: null,
      error
    })
  }
}

export default requestTimeout
