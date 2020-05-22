import {
  LONG_INTEGER_SQL_TYPE,
  NOTIFICATIONS_TABLE_NAME,
  SUBSCRIBERS_TABLE_NAME,
  NotificationStatus,
  LazinessStrategy,
  PrivateOperationType
} from '../constants'
import { SubscriptionStatus } from '../constants'

const pushNotificationAndGetSubscriptions = async (pool, payload) => {
  const {
    database: { escapeId, escapeStr, runQuery, runRawQuery, encodeJsonPath },
    invokeOperation,
    generateGuid
  } = pool

  const { event } = payload
  const notificationsTableNameAsId = escapeId(NOTIFICATIONS_TABLE_NAME)
  const subscribersTableNameAsId = escapeId(SUBSCRIBERS_TABLE_NAME)
  const insertionId = generateGuid(event.aggregateId, event.aggregateVersion)

  await runRawQuery(`INSERT INTO ${notificationsTableNameAsId}(
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
  )} AND (
          json_extract(${subscribersTableNameAsId}."eventTypes", ${escapeStr(
    `$."${encodeJsonPath(event.type)}"`
  )}) = 1 OR
          json_extract(${subscribersTableNameAsId}."eventTypes", '$') IS NULL
        ) AND ( 
          json_extract(${subscribersTableNameAsId}."aggregateIds", ${escapeStr(
    `$."${encodeJsonPath(event.aggregateId)}"`
  )}) = 1 OR
          json_extract(${subscribersTableNameAsId}."aggregateIds", '$') IS NULL
        )
      ) "subscriptionIds";

      COMMIT;
      BEGIN IMMEDIATE;
  `)

  const subscriptionIdsResult = await runQuery(`
    SELECT "subscriptionId" FROM ${notificationsTableNameAsId}
    WHERE "insertionId" = ${escapeStr(insertionId)}
  `)

  const promises = []
  for (const { subscriptionId } of subscriptionIdsResult) {
    const input = {
      type: PrivateOperationType.PULL_NOTIFICATIONS,
      payload: {
        subscriptionId
      }
    }

    promises.push(invokeOperation(pool, LazinessStrategy.EAGER, input))
  }
  await Promise.all(promises)
}

export default pushNotificationAndGetSubscriptions
