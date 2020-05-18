import {
  NOTIFICATIONS_TABLE_NAME,
  SUBSCRIBERS_TABLE_NAME,
  BATCHES_TABLE_NAME,
  NOTIFICATION_UPDATE_SYMBOL,
  STATUS_DELIVER,
  STATUS_SKIP,
  STATUS_ERROR,
  PAUSE_SYMBOL,
  RESUME_SYMBOL
} from '../constants'

const manageSubscription = async (pool, mode, eventSubscriber) => {
  if (!(mode === RESUME_SYMBOL || mode === PAUSE_SYMBOL)) {
    throw new Error(`Wrong mode ${String(mode)}`)
  }
  const {
    database: { runRawQuery, runQuery, escapeStr, escapeId },
    pullNotificationsAsBatchForSubscriber,
    pushNotificationAndGetSubscriptions,
    multiplexAsync
  } = pool

  const notificationsTableNameAsId = escapeId(NOTIFICATIONS_TABLE_NAME)
  const subscribersTableNameAsId = escapeId(SUBSCRIBERS_TABLE_NAME)
  const batchesTableNameAsId = escapeId(BATCHES_TABLE_NAME)

  const subscriptionIdResult = await runQuery(`
    SELECT "subscriptionId" from ${subscribersTableNameAsId}
    WHERE "eventSubscriber" = ${escapeStr(eventSubscriber)}
  `)
  const subscriptionId =
    Array.isArray(subscriptionIdResult) && subscriptionIdResult.length > 0
      ? subscriptionIdResult[0].subscriptionId
      : null

  if (subscriptionId == null) {
    throw new Error(
      `Event subscriber "${eventSubscriber}" does not have actual subscription`
    )
  }

  if (mode === RESUME_SYMBOL) {
    await runRawQuery(`
      UPDATE ${subscribersTableNameAsId}
      SET "status" = ${escapeStr(STATUS_DELIVER)}
      WHERE "eventSubscriber" = ${escapeStr(eventSubscriber)}
      AND "status" <> ${escapeStr(STATUS_ERROR)};

      COMMIT;
      BEGIN IMMEDIATE;
    `)

    const subscriptionIds = await pushNotificationAndGetSubscriptions(
      pool,
      NOTIFICATION_UPDATE_SYMBOL,
      eventSubscriber
    )

    if (subscriptionIds == null || subscriptionIds.length !== 1) {
      throw new Error(
        `Notification for event subscriber ${eventSubscriber} cannot be pushed`
      )
    }

    multiplexAsync(pullNotificationsAsBatchForSubscriber, pool, subscriptionId)
  } else {
    await runRawQuery(`
      DELETE FROM ${batchesTableNameAsId}
      WHERE "batchId" IN (
        SELECT "batchId" from ${notificationsTableNameAsId}
        WHERE "eventSubscriber" = ${escapeStr(eventSubscriber)}
      );

      DELETE FROM ${notificationsTableNameAsId}
      WHERE "eventSubscriber" = ${escapeStr(eventSubscriber)};

      UPDATE ${subscribersTableNameAsId}
      SET "status" = ${escapeStr(STATUS_SKIP)}
      WHERE "eventSubscriber" = ${escapeStr(eventSubscriber)}
      AND "status" <> ${escapeStr(STATUS_ERROR)};

      COMMIT;
      BEGIN IMMEDIATE;
    `)
  }
}

export default manageSubscription
