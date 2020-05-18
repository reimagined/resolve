import {
  DELIVERY_STRATEGY_ACTIVE_XA,
  STATUS_XA_PREPARE_NOTIFICATION,
  BATCHES_TABLE_NAME,
  NOTIFICATIONS_TABLE_NAME,
  SUBSCRIBERS_TABLE_NAME,
  STATUS_ERROR,
  STATUS_DELIVER
} from '../constants'

const acknowledgeBatch = async (pool, batchId, result) => {
  const {
    database: { runRawQuery, runQuery, escapeId, escapeStr },
    getNextCursor,
    finalizeAndReportBatch,
    consumer
  } = pool
  const notificationsTableNameAsId = escapeId(NOTIFICATIONS_TABLE_NAME)
  const subscribersTableNameAsId = escapeId(SUBSCRIBERS_TABLE_NAME)
  const batchesTableNameAsId = escapeId(BATCHES_TABLE_NAME)

  const applyingEvents = await runQuery(`
    SELECT * FROM ${batchesTableNameAsId}
    WHERE "batchId" = ${escapeStr(batchId)}
    ORDER BY "eventIndex" ASC
  `)

  const affectedNotifications = await runQuery(`
    SELECT * FROM ${notificationsTableNameAsId}
    LEFT JOIN ${subscribersTableNameAsId}
    ON ${subscribersTableNameAsId}."subscriptionId" = 
    ${notificationsTableNameAsId}."subscriptionId"
    WHERE ${notificationsTableNameAsId}."batchId" =
    ${escapeStr(batchId)}
    LIMIT 1
  `)

  if (affectedNotifications == null || affectedNotifications.length === 0) {
    throw new Error(
      `Fatal error: database corrupted, bus run into inconsistent state`
    )
  }

  const subscriptionDescription = affectedNotifications[0]

  try {
    const { successEvent, failedEvent, error } = result
    const lastSuccessEventIdx =
      successEvent != null
        ? applyingEvents.findIndex(
            ({ aggregateIdAndVersion }) =>
              aggregateIdAndVersion ===
              `${successEvent.aggregateId}:${successEvent.aggregateVersion}`
          ) + 1
        : 0
    const nextCursor = await getNextCursor(
      subscriptionDescription.cursor,
      applyingEvents.slice(0, lastSuccessEventIdx)
    )

    if (
      subscriptionDescription.deliveryStrategy ===
        DELIVERY_STRATEGY_ACTIVE_XA &&
      subscriptionDescription.xaTransactionId != null
    ) {
      if (subscriptionDescription.status === STATUS_XA_PREPARE_NOTIFICATION) {
        throw new Error('Finalizing batch in XA session failed')
      }

      await runRawQuery(`
        UPDATE ${notificationsTableNameAsId} SET
        "status" = ${escapeStr(STATUS_XA_PREPARE_NOTIFICATION)}
        WHERE "batchId" = ${batchId};

        COMMIT;
        BEGIN IMMEDIATE;
      `)

      await consumer.commitXATransaction(
        subscriptionDescription.eventSubscriber,
        {
          xaTransactionId: subscriptionDescription.xaTransactionId,
          batchId
        }
      )
    }

    await finalizeAndReportBatch(
      pool,
      subscriptionDescription,
      error == null ? STATUS_DELIVER : STATUS_ERROR,
      {
        cursor: nextCursor,
        successEvent,
        failedEvent,
        error
      }
    )
  } catch (error) {
    let compositeError = error

    if (
      subscriptionDescription.deliveryStrategy ===
        DELIVERY_STRATEGY_ACTIVE_XA &&
      subscriptionDescription.xaTransactionId != null
    ) {
      compositeError = new Error(error.message)
      compositeError.stack = error.stack

      try {
        await consumer.rollbackXATransaction(
          subscriptionDescription.eventSubscriber,
          {
            xaTransactionId: subscriptionDescription.xaTransactionId,
            batchId
          }
        )
      } catch (rollbackError) {
        compositeError.message = `${compositeError.message}\n${rollbackError.message}`
        compositeError.stack = `${compositeError.stack}\n${rollbackError.stack}`
      }
    }

    await finalizeAndReportBatch(pool, subscriptionDescription, STATUS_ERROR, {
      error: compositeError
    })
  }
}

export default acknowledgeBatch
