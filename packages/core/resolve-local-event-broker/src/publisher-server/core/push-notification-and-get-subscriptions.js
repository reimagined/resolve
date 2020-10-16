import {
  LONG_INTEGER_SQL_TYPE,
  NOTIFICATIONS_TABLE_NAME,
  SUBSCRIBERS_TABLE_NAME,
  NotificationStatus,
  LazinessStrategy,
  PrivateOperationType,
  DeliveryStrategy,
  ConsumerMethod,
} from '../constants'
import { SubscriptionStatus } from '../constants'

const pushNotificationAndGetSubscriptions = async (pool, payload) => {
  const {
    database: { escapeId, escapeStr, runQuery, runRawQuery, encodeJsonPath },
    invokeOperation,
    invokeConsumer,
    generateGuid,
  } = pool

  const { event } = payload
  const notificationsTableNameAsId = escapeId(NOTIFICATIONS_TABLE_NAME)
  const subscribersTableNameAsId = escapeId(SUBSCRIBERS_TABLE_NAME)
  const insertionId = generateGuid(event.aggregateId, event.aggregateVersion)

  await runRawQuery(`
    INSERT OR IGNORE INTO ${notificationsTableNameAsId}(
      "insertionId",
      "subscriptionId",
      "incomingTimestamp",
      "processStartTimestamp",
      "processEndTimestamp",
      "heartbeatTimestamp",
      "aggregateIdAndVersion",
      "status"
    ) SELECT 
      ${escapeStr(insertionId)} AS "insertionId",
      "subscriptionIds"."subscriptionId" AS "subscriptionId",
      CAST(strftime('%s','now') || substr(strftime('%f','now'),4) AS ${LONG_INTEGER_SQL_TYPE}) AS "incomingTimestamp",
      NULL AS "processStartTimestamp",
      NULL AS "processEndTimestamp",
      NULL AS "heartbeatTimestamp",
      ${escapeStr(
        `${event.aggregateId}:${event.aggregateVersion}`
      )} AS "aggregateIdAndVersion",
      ${escapeStr(NotificationStatus.RECIEVED)} AS "status"
    FROM (
      SELECT ${subscribersTableNameAsId}."subscriptionId"
      FROM ${subscribersTableNameAsId}
      WHERE ${subscribersTableNameAsId}."status" = ${escapeStr(
    SubscriptionStatus.DELIVER
  )}
      AND ${subscribersTableNameAsId}."deliveryStrategy" <> ${escapeStr(
    DeliveryStrategy.PASSTHROUGH
  )}
      AND (
        json_extract(
          ${subscribersTableNameAsId}."eventTypes",
          ${escapeStr(`$.${JSON.stringify(encodeJsonPath(event.type))}`)}
        ) = 1 OR
        json_extract(
          ${subscribersTableNameAsId}."eventTypes", '$'
        ) IS NULL
      ) AND ( 
        json_extract(
          ${subscribersTableNameAsId}."aggregateIds",
          ${escapeStr(`$.${JSON.stringify(encodeJsonPath(event.aggregateId))}`)}
        ) = 1 OR
        json_extract(
          ${subscribersTableNameAsId}."aggregateIds", '$'
        ) IS NULL
      ) AND NOT EXISTS (
        SELECT ${notificationsTableNameAsId}."subscriptionId"
        FROM ${notificationsTableNameAsId}
        WHERE ${notificationsTableNameAsId}."subscriptionId" =
        ${notificationsTableNameAsId}
        AND ${notificationsTableNameAsId}."batchId" IS NULL
      )
    ) "subscriptionIds";

    COMMIT;
    BEGIN IMMEDIATE;
  `)

  const subscriptionIdsResult = await runQuery(`
    SELECT "subscriptionId" FROM ${notificationsTableNameAsId}
    WHERE "insertionId" = ${escapeStr(insertionId)}
  `)

  const pullPromises = []
  for (const { subscriptionId } of subscriptionIdsResult) {
    const input = {
      type: PrivateOperationType.PULL_NOTIFICATIONS,
      payload: {
        subscriptionId,
      },
    }

    pullPromises.push(invokeOperation(pool, LazinessStrategy.EAGER, input))
  }
  await Promise.all(pullPromises)

  const passthroughSubscriptions = await runQuery(`
    SELECT ${subscribersTableNameAsId}."eventSubscriber" AS "eventSubscriber"
    FROM ${subscribersTableNameAsId}
    WHERE ${subscribersTableNameAsId}."status" = ${escapeStr(
    SubscriptionStatus.DELIVER
  )}
    AND ${subscribersTableNameAsId}."deliveryStrategy" = ${escapeStr(
    DeliveryStrategy.PASSTHROUGH
  )}
    AND (
      json_extract(
        ${subscribersTableNameAsId}."eventTypes",
        ${escapeStr(`$."${encodeJsonPath(event.type)}"`)}
      ) = 1 OR
      json_extract(
        ${subscribersTableNameAsId}."eventTypes", '$'
      ) IS NULL
    ) AND ( 
      json_extract(
        ${subscribersTableNameAsId}."aggregateIds",
        ${escapeStr(`$."${encodeJsonPath(event.aggregateId)}"`)}
      ) = 1 OR
      json_extract(
        ${subscribersTableNameAsId}."aggregateIds", '$'
      ) IS NULL
    )
  `)

  const passthroughPromises = []
  for (const { eventSubscriber } of passthroughSubscriptions) {
    passthroughPromises.push(
      invokeConsumer(pool, ConsumerMethod.SendEvents, {
        eventSubscriber,
        events: [event],
        batchId: null,
      })
    )
  }

  await Promise.all(passthroughPromises)
}

export default pushNotificationAndGetSubscriptions
