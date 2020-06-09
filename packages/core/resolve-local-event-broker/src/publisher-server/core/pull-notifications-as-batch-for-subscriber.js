import {
  LONG_INTEGER_SQL_TYPE,
  NOTIFICATIONS_TABLE_NAME,
  SUBSCRIBERS_TABLE_NAME,
  LazinessStrategy,
  PrivateOperationType
} from '../constants'

const pullNotificationsAsBatchForSubscriber = async (pool, payload) => {
  const {
    database: { escapeStr, escapeId, runQuery, runRawQuery },
    parseSubscription,
    invokeOperation,
    generateGuid
  } = pool

  const { subscriptionId } = payload
  const notificationsTableNameAsId = escapeId(NOTIFICATIONS_TABLE_NAME)
  const subscribersTableNameAsId = escapeId(SUBSCRIBERS_TABLE_NAME)

  const batchId = generateGuid(subscriptionId)
  await runRawQuery(`
      UPDATE ${notificationsTableNameAsId} SET
      "processStartTimestamp" = CAST(strftime('%s','now') || substr(strftime('%f','now'),4) AS ${LONG_INTEGER_SQL_TYPE}),
      "heartbeatTimestamp" = CAST(strftime('%s','now') || substr(strftime('%f','now'),4) AS ${LONG_INTEGER_SQL_TYPE}),
      "batchId" = ${escapeStr(batchId)}
      WHERE ${notificationsTableNameAsId}."subscriptionId" = ${escapeStr(
    subscriptionId
  )}
      AND NOT EXISTS (
        SELECT "N".* FROM ${notificationsTableNameAsId} "N"
        WHERE "N"."subscriptionId" = ${escapeStr(subscriptionId)}
        AND "N"."batchId" IS NOT NULL
      )
      AND EXISTS (
        SELECT "S".* FROM ${subscribersTableNameAsId} "S"
        WHERE "S"."subscriptionId" = ${escapeStr(subscriptionId)}
      );

      COMMIT;
      BEGIN IMMEDIATE;
    `)

  const affectedNotifications = await runQuery(`
      SELECT ${subscribersTableNameAsId}."subscriptionId" AS "subscriptionId",
      ${subscribersTableNameAsId}."eventSubscriber" AS "eventSubscriber"
      FROM ${notificationsTableNameAsId} LEFT JOIN ${subscribersTableNameAsId} ON
      ${subscribersTableNameAsId}."subscriptionId" = ${notificationsTableNameAsId}."subscriptionId"
      WHERE ${subscribersTableNameAsId}."subscriptionId" =
      ${escapeStr(subscriptionId)}
      AND  ${notificationsTableNameAsId}."batchId" = 
      ${escapeStr(batchId)}
      LIMIT 1
    `)

  if (affectedNotifications == null || affectedNotifications.length < 1) {
    return
  }
  const activeBatch = await parseSubscription({
    ...affectedNotifications[0],
    batchId
  })
  const input = {
    type: PrivateOperationType.DELIVER_BATCH,
    payload: {
      activeBatch
    }
  }

  await invokeOperation(pool, LazinessStrategy.EAGER, input)
}

export default pullNotificationsAsBatchForSubscriber
