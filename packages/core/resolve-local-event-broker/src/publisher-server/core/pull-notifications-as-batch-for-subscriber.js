import {
  LONG_INTEGER_SQL_TYPE,
  NOTIFICATIONS_TABLE_NAME,
  SUBSCRIBERS_TABLE_NAME,
  STATUS_PROCESSING_NOTIFICATION
} from '../constants'

const pullNotificationsAsBatchForSubscriber = async (pool, subscriptionId) => {
  const {
    database: { runRawQuery, runQuery, escapeStr, escapeId },
    deliverBatchForSubscriber
  } = pool

  const notificationsTableNameAsId = escapeId(NOTIFICATIONS_TABLE_NAME)
  const subscribersTableNameAsId = escapeId(SUBSCRIBERS_TABLE_NAME)

  const batchId = `${subscriptionId}${Date.now()}${Math.random()}`

  await runRawQuery(`
    UPDATE ${notificationsTableNameAsId} SET
    "processStartTimestamp" = CAST(strftime('%s','now') || substr(strftime('%f','now'),4) AS ${LONG_INTEGER_SQL_TYPE}),
    "heartbeatTimestamp" = CAST(strftime('%s','now') || substr(strftime('%f','now'),4) AS ${LONG_INTEGER_SQL_TYPE}),
    "status" = ${escapeStr(STATUS_PROCESSING_NOTIFICATION)},
    "batchId" = ${escapeStr(batchId)}
    WHERE "subscriptionId" = ${escapeStr(subscriptionId)}
    AND NOT EXISTS (
      SELECT * FROM ${notificationsTableNameAsId}
      WHERE ${notificationsTableNameAsId}."subscriptionId" = 
      ${escapeStr(subscriptionId)}
      AND ${notificationsTableNameAsId}."batchId" IS NOT NULL
    );
    
    COMMIT;
    BEGIN IMMEDIATE;
  `)

  const affectedNotifications = await runQuery(`
    SELECT * FROM ${notificationsTableNameAsId}
    LEFT JOIN ${subscribersTableNameAsId}
    ON ${subscribersTableNameAsId}."subscriptionId" = 
    ${notificationsTableNameAsId}."subscriptionId"
    WHERE ${notificationsTableNameAsId}."batchId" = ${escapeStr(batchId)}
    LIMIT 1
  `)

  if (affectedNotifications == null || affectedNotifications.length < 1) {
    return
  }

  await deliverBatchForSubscriber(pool, affectedNotifications[0])
}

export default pullNotificationsAsBatchForSubscriber
