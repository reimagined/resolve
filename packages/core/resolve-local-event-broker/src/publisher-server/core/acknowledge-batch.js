import {
  BATCHES_TABLE_NAME,
  NOTIFICATIONS_TABLE_NAME,
  SUBSCRIBERS_TABLE_NAME,
  DeliveryStrategy,
  NotificationStatus,
  ConsumerMethod,
  PrivateOperationType,
  LazinessStrategy
} from '../constants'

const retryRollback = new Error('Retrying rollback marker')

const acknowledgeBatch = async (pool, payload) => {
  const {
    database: { runRawQuery, runQuery, escapeStr, escapeId },
    parseSubscription,
    getNextCursor,
    invokeConsumer,
    invokeOperation,
    serializeError
  } = pool

  const { batchId, result } = payload

  const notificationsTableNameAsId = escapeId(NOTIFICATIONS_TABLE_NAME)
  const subscribersTableNameAsId = escapeId(SUBSCRIBERS_TABLE_NAME)
  const batchesTableNameAsId = escapeId(BATCHES_TABLE_NAME)

  const [applyingEvents, affectedNotifications] = await Promise.all([
    runQuery(`
      SELECT * FROM ${batchesTableNameAsId}
      WHERE ${batchesTableNameAsId}."batchId" = ${escapeStr(batchId)}
      ORDER BY ${batchesTableNameAsId}."eventIndex" ASC
    `),
    runQuery(`
      SELECT ${subscribersTableNameAsId}."subscriptionId" AS "subscriptionId",
      ${subscribersTableNameAsId}."eventSubscriber" AS "eventSubscriber",
      ${subscribersTableNameAsId}."deliveryStrategy" AS "deliveryStrategy",
      ${subscribersTableNameAsId}."cursor" AS "cursor",
      ${notificationsTableNameAsId}."status" AS "runStatus",
      ${notificationsTableNameAsId}."xaTransactionId" AS "xaTransactionId",
      ${notificationsTableNameAsId}."batchId" AS "batchId"
      FROM ${notificationsTableNameAsId} LEFT JOIN ${subscribersTableNameAsId}
      ON ${subscribersTableNameAsId}."subscriptionId" = 
      ${notificationsTableNameAsId}."subscriptionId"
      WHERE ${notificationsTableNameAsId}."batchId" = ${escapeStr(batchId)}
      LIMIT 1
    `)
  ])
  if (affectedNotifications == null || affectedNotifications.length === 0) {
    return
  }
  const subscriptionDescription = parseSubscription(affectedNotifications[0])
  if (
    subscriptionDescription.runStatus !== NotificationStatus.PROCESSING &&
    subscriptionDescription.runStatus !==
      NotificationStatus.ACKNOWLEDGE_ENTERING &&
    subscriptionDescription.runStatus !==
      NotificationStatus.ACKNOWLEDGE_XA_COMMITING &&
    subscriptionDescription.runStatus !==
      NotificationStatus.ACKNOWLEDGE_XA_ROLLBACKING
  ) {
    return
  }
  if (subscriptionDescription.runStatus === NotificationStatus.PROCESSING) {
    await runRawQuery(`
      UPDATE ${notificationsTableNameAsId} SET
      "status" = ${escapeStr(NotificationStatus.ACKNOWLEDGE_ENTERING)}
      WHERE ${notificationsTableNameAsId}."batchId" = ${escapeStr(batchId)}
      AND ${notificationsTableNameAsId}."status" = ${escapeStr(
      NotificationStatus.PROCESSING
    )};
      
      COMMIT;
      BEGIN IMMEDIATE;
    `)

    const result = await runQuery(`
      SELECT ${notificationsTableNameAsId}."status" AS "runStatus"
      FROM ${notificationsTableNameAsId}
      WHERE ${notificationsTableNameAsId}."batchId" = ${escapeStr(batchId)}
      AND ${notificationsTableNameAsId}."status" = ${escapeStr(
      NotificationStatus.ACKNOWLEDGE_ENTERING
    )}
      LIMIT 1
    `)
    if (result == null || result.length === 0) {
      return
    }

    subscriptionDescription.runStatus = NotificationStatus.ACKNOWLEDGE_ENTERING
  }
  const activeBatch = {
    eventSubscriber: subscriptionDescription.eventSubscriber,
    subscriptionId: subscriptionDescription.subscriptionId,
    batchId
  }
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
      subscriptionDescription.deliveryStrategy === DeliveryStrategy.ACTIVE_XA &&
      subscriptionDescription.xaTransactionId != null
    ) {
      if (
        subscriptionDescription.runStatus ===
          NotificationStatus.ACKNOWLEDGE_ENTERING ||
        subscriptionDescription.runStatus ===
          NotificationStatus.ACKNOWLEDGE_XA_COMMITING
      ) {
        if (
          subscriptionDescription.runStatus ===
          NotificationStatus.ACKNOWLEDGE_ENTERING
        ) {
          await runRawQuery(`
            UPDATE ${notificationsTableNameAsId} SET
            "status" = ${escapeStr(NotificationStatus.ACKNOWLEDGE_XA_COMMITING)}
            WHERE "batchId" = ${escapeStr(batchId)};
            
            COMMIT;
            BEGIN IMMEDIATE;
          `)
        }
        try {
          await invokeConsumer(pool, ConsumerMethod.CommitXATransaction, {
            eventSubscriber: subscriptionDescription.eventSubscriber,
            xaTransactionId: subscriptionDescription.xaTransactionId,
            batchId
          })
        } catch (commitError) {
          if (
            !(
              commitError != null &&
              /Transaction .*? Is Not Found/i.test(commitError.message)
            ) ||
            subscriptionDescription.runStatus ===
              NotificationStatus.ACKNOWLEDGE_ENTERING
          ) {
            throw commitError
          }
        }
      } else if (
        subscriptionDescription.runStatus ===
        NotificationStatus.ACKNOWLEDGE_XA_ROLLBACKING
      ) {
        throw retryRollback
      } else {
        throw new Error(
          `Inconsistent XA-state ${subscriptionDescription.runStatus}`
        )
      }
    }
    const input = {
      type: PrivateOperationType.FINALIZE_BATCH,
      payload: {
        activeBatch,
        result: {
          cursor: nextCursor,
          successEvent,
          failedEvent,
          error: serializeError(error)
        }
      }
    }
    await invokeOperation(pool, LazinessStrategy.EAGER, input)
  } catch (error) {
    let compositeError = error
    if (
      subscriptionDescription.deliveryStrategy === DeliveryStrategy.ACTIVE_XA &&
      subscriptionDescription.xaTransactionId != null
    ) {
      compositeError = new Error(error.message)
      compositeError.stack = error.stack
      if (
        subscriptionDescription.runStatus ===
          NotificationStatus.ACKNOWLEDGE_ENTERING ||
        subscriptionDescription.runStatus ===
          NotificationStatus.ACKNOWLEDGE_XA_COMMITING
      ) {
        await runRawQuery(`
          UPDATE ${notificationsTableNameAsId} SET
          "status" = ${escapeStr(NotificationStatus.ACKNOWLEDGE_XA_ROLLBACKING)}
          WHERE "batchId" = ${escapeStr(batchId)};
          
          COMMIT;
          BEGIN IMMEDIATE;
        `)
      }
      try {
        await invokeConsumer(pool, ConsumerMethod.RollbackXATransaction, {
          eventSubscriber: subscriptionDescription.eventSubscriber,
          xaTransactionId: subscriptionDescription.xaTransactionId,
          batchId
        })
      } catch (rollbackError) {
        if (
          !(
            rollbackError != null &&
            /Transaction .*? Is Not Found/i.test(rollbackError.message)
          ) ||
          subscriptionDescription.runStatus ===
            NotificationStatus.ACKNOWLEDGE_ENTERING
        ) {
          compositeError.message = `${compositeError.message}\n${rollbackError.message}`
          compositeError.stack = `${compositeError.stack}\n${rollbackError.stack}`
        } else if (error === retryRollback) {
          compositeError = null
        }
      }
    }
    const input = {
      type: PrivateOperationType.FINALIZE_BATCH,
      payload: {
        activeBatch,
        result: {
          error: serializeError(compositeError)
        }
      }
    }
    await invokeOperation(pool, LazinessStrategy.EAGER, input)
  }
}

export default acknowledgeBatch
