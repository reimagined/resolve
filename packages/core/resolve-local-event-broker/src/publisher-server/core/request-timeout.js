import {
  NOTIFICATIONS_TABLE_NAME,
  SUBSCRIBERS_TABLE_NAME,
  BATCHES_TABLE_NAME,
  DeliveryStrategy,
  NotificationStatus,
  ConsumerMethod,
  LazinessStrategy,
  PrivateOperationType,
} from '../constants';

const retryRollback = new Error('Retrying rollback marker');
async function requestTimeout(pool, payload) {
  const {
    database: { runQuery, runRawQuery, escapeStr, escapeId },
    parseSubscription,
    invokeConsumer,
    invokeOperation,
    getNextCursor,
    serializeError,
  } = pool;

  const { batchId } = payload;
  const notificationsTableNameAsId = escapeId(NOTIFICATIONS_TABLE_NAME);
  const subscribersTableNameAsId = escapeId(SUBSCRIBERS_TABLE_NAME);
  const batchesTableNameAsId = escapeId(BATCHES_TABLE_NAME);

  const affectedNotifications = await runQuery(`
      SELECT ${subscribersTableNameAsId}."eventSubscriber" AS "eventSubscriber",
      ${subscribersTableNameAsId}."deliveryStrategy" AS "deliveryStrategy",
      ${subscribersTableNameAsId}."subscriptionId" AS "subscriptionId",
      ${subscribersTableNameAsId}."successEvent" AS "successEvent",
      ${subscribersTableNameAsId}."cursor" AS "cursor",
      ${notificationsTableNameAsId}."status" AS "runStatus",
      ${notificationsTableNameAsId}."xaTransactionId" AS "xaTransactionId",
      ${notificationsTableNameAsId}."batchId" AS "batchId"
      FROM ${notificationsTableNameAsId} LEFT JOIN ${subscribersTableNameAsId}
      ON ${subscribersTableNameAsId}."subscriptionId" = 
      ${notificationsTableNameAsId}."subscriptionId"
      WHERE ${notificationsTableNameAsId}."batchId" = ${escapeStr(batchId)}
      LIMIT 1
    `);
  if (affectedNotifications == null || affectedNotifications.length === 0) {
    return;
  }
  const subscriptionDescription = parseSubscription(affectedNotifications[0]);
  if (
    subscriptionDescription.runStatus !== NotificationStatus.PROCESSING &&
    subscriptionDescription.runStatus !== NotificationStatus.TIMEOUT_ENTERING &&
    !subscriptionDescription.runStatus.startsWith(
      NotificationStatus.TIMEOUT_XA_COMMITING
    ) &&
    subscriptionDescription.runStatus !==
      NotificationStatus.TIMEOUT_XA_ROLLBACKING
  ) {
    return;
  }

  if (subscriptionDescription.runStatus === NotificationStatus.PROCESSING) {
    await runRawQuery(`
        UPDATE ${notificationsTableNameAsId} SET
        "status" = ${escapeStr(NotificationStatus.TIMEOUT_ENTERING)}
        WHERE ${notificationsTableNameAsId}."batchId" = ${escapeStr(batchId)}
        AND ${notificationsTableNameAsId}."status" = ${escapeStr(
      NotificationStatus.PROCESSING
    )};

        COMMIT;
        BEGIN IMMEDIATE;
      `);

    const result = await runQuery(`
        SELECT ${notificationsTableNameAsId}."status" AS "runStatus"
        FROM ${notificationsTableNameAsId}
        WHERE ${notificationsTableNameAsId}."batchId" = ${escapeStr(batchId)}
        AND ${notificationsTableNameAsId}."status" = ${escapeStr(
      NotificationStatus.TIMEOUT_ENTERING
    )}
        LIMIT 1
      `);
    if (result == null || result.length === 0) {
      return;
    }

    subscriptionDescription.runStatus = NotificationStatus.TIMEOUT_ENTERING;
  }
  const {
    eventSubscriber,
    deliveryStrategy,
    runStatus,
    xaTransactionId,
    cursor,
    successEvent: prevSuccessEvent,
  } = subscriptionDescription;
  const activeBatch = {
    batchId: subscriptionDescription.batchId,
    subscriptionId: subscriptionDescription.subscriptionId,
    eventSubscriber: subscriptionDescription.eventSubscriber,
  };

  if (
    (deliveryStrategy === DeliveryStrategy.ACTIVE_XA &&
      xaTransactionId == null) ||
    deliveryStrategy !== DeliveryStrategy.ACTIVE_XA
  ) {
    const input = {
      type: PrivateOperationType.FINALIZE_BATCH,
      payload: {
        activeBatch,
        result: {
          error: serializeError(new Error(`Timeout with consuming batch`)),
        },
      },
    };
    await invokeOperation(pool, LazinessStrategy.EAGER, input);
    return;
  }

  const result = {
    successEvent: null,
    error: null,
    cursor,
  };
  try {
    if (
      runStatus === NotificationStatus.TIMEOUT_ENTERING ||
      runStatus.startsWith(NotificationStatus.TIMEOUT_XA_COMMITING)
    ) {
      let appliedEventCount = null;
      if (runStatus === NotificationStatus.TIMEOUT_ENTERING) {
        // eslint-disable-next-line no-bitwise
        appliedEventCount = ~~(await invokeConsumer(
          pool,
          ConsumerMethod.CommitXATransaction,
          {
            eventSubscriber,
            xaTransactionId,
            batchId,
            countEvents: true,
          }
        ));
        await runRawQuery(`
          UPDATE ${notificationsTableNameAsId} SET
          "status" = ${escapeStr(
            // eslint-disable-next-line no-bitwise
            `${NotificationStatus.TIMEOUT_XA_COMMITING}${~~appliedEventCount}`
          )}
          WHERE "batchId" = ${escapeStr(batchId)};

          COMMIT;
          BEGIN IMMEDIATE;
        `);
      } else {
        // eslint-disable-next-line no-bitwise
        appliedEventCount = ~~runStatus.substring(
          NotificationStatus.TIMEOUT_XA_COMMITING.length
        );
      }
      if (appliedEventCount > 0) {
        const applyingEvents = await runQuery(`
          SELECT * FROM ${batchesTableNameAsId}
          WHERE ${batchesTableNameAsId}."batchId" = ${escapeStr(batchId)}
          ORDER BY ${batchesTableNameAsId}."eventIndex" ASC
          LIMIT ${+appliedEventCount}
        `);
        result.successEvent = applyingEvents[appliedEventCount - 1];
        const lastSuccessEventIdx =
          result.successEvent != null
            ? applyingEvents.findIndex(
                ({ aggregateIdAndVersion }) =>
                  aggregateIdAndVersion ===
                  `${result.successEvent.aggregateId}:${result.successEvent.aggregateVersion}`
              ) + 1
            : 0;
        result.cursor = await getNextCursor(
          cursor,
          applyingEvents.slice(0, lastSuccessEventIdx)
        );
      }

      const isXaCommitOk = await invokeConsumer(
        pool,
        ConsumerMethod.CommitXATransaction,
        {
          eventSubscriber,
          xaTransactionId,
          batchId,
        }
      );

      if (!isXaCommitOk) {
        result.successEvent = prevSuccessEvent;
      }
    } else if (runStatus === NotificationStatus.TIMEOUT_XA_ROLLBACKING) {
      throw retryRollback;
    } else {
      throw new Error(
        `Inconsistent XA-state ${subscriptionDescription.runStatus}`
      );
    }
  } catch (error) {
    let compositeError = new Error(error.message);
    compositeError.stack = error.stack;
    if (
      runStatus === NotificationStatus.TIMEOUT_ENTERING ||
      runStatus.startsWith(NotificationStatus.TIMEOUT_XA_COMMITING)
    ) {
      await runRawQuery(`
      UPDATE ${notificationsTableNameAsId} SET
      "status" = ${escapeStr(NotificationStatus.TIMEOUT_XA_ROLLBACKING)}
      WHERE "batchId" = ${escapeStr(batchId)};

      COMMIT;
      BEGIN IMMEDIATE;
    `);
    }
    try {
      const isXaRollbackOk = await invokeConsumer(
        pool,
        ConsumerMethod.RollbackXATransaction,
        {
          eventSubscriber,
          xaTransactionId,
          batchId,
        }
      );

      if (!isXaRollbackOk) {
        throw new Error(
          `Xa-transaction ${xaTransactionId} early marked to rollback, but was auto-committed`
        );
      }
    } catch (rollbackError) {
      compositeError.message = `${compositeError.message}\n${rollbackError.message}`;
      compositeError.stack = `${compositeError.stack}\n${rollbackError.stack}`;
    }

    result.error = serializeError(compositeError);
  }

  const input = {
    type: PrivateOperationType.FINALIZE_BATCH,
    payload: {
      activeBatch,
      result,
    },
  };

  await invokeOperation(pool, LazinessStrategy.EAGER, input);
}

export default requestTimeout;
