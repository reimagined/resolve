import {
  STATUS_ACCEPTED_NOTIFICATION,
  LONG_INTEGER_SQL_TYPE,
  NOTIFICATION_EVENT_SYMBOL,
  NOTIFICATION_UPDATE_SYMBOL,
  NOTIFICATIONS_TABLE_NAME,
  SUBSCRIBERS_TABLE_NAME,
  STATUS_DELIVER
} from '../constants'

const pushNotificationAndGetSubscriptions = async (pool, mode, content) => {
  if (
    mode !== NOTIFICATION_EVENT_SYMBOL &&
    mode !== NOTIFICATION_UPDATE_SYMBOL
  ) {
    throw new Error(`Invalid mode ${String(mode)}`)
  }
  const event = mode === NOTIFICATION_EVENT_SYMBOL ? content : null
  const eventSubscriber = mode === NOTIFICATION_UPDATE_SYMBOL ? content : null

  const {
    database: { runRawQuery, runQuery, escapeStr, escapeId, encodeJsonPath },
    consumer
  } = pool
  const notificationsTableNameAsId = escapeId(NOTIFICATIONS_TABLE_NAME)
  const subscribersTableNameAsId = escapeId(SUBSCRIBERS_TABLE_NAME)
  const insertionId =
    mode === NOTIFICATION_EVENT_SYMBOL
      ? `${event.aggregateId}${
          event.aggregateVersion
        }${Date.now()}${Math.random()}`
      : `FORCEUPDATE${Date.now()}${Math.random()}`

  await runRawQuery(`
    INSERT INTO ${notificationsTableNameAsId}(
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
        ${
          mode === NOTIFICATION_EVENT_SYMBOL
            ? escapeStr(`${event.aggregateId}:${event.aggregateVersion}`)
            : escapeStr('FORCEUPDATE')
        } AS "aggregateIdAndVersion",
        ${escapeStr(STATUS_ACCEPTED_NOTIFICATION)} AS "status"
      FROM (
        SELECT ${subscribersTableNameAsId}."subscriptionId"
        FROM ${subscribersTableNameAsId}
        WHERE ${subscribersTableNameAsId}."status" = ${escapeStr(
    STATUS_DELIVER
  )} AND ${
    mode === NOTIFICATION_EVENT_SYMBOL
      ? `(
          json_extract(${subscribersTableNameAsId}."eventTypes", ${escapeStr(
          `$."${encodeJsonPath(event.type)}"`
        )}) = 1 OR
          json_extract(${subscribersTableNameAsId}."eventTypes", '$') IS NULL
        ) AND ( 
          json_extract(${subscribersTableNameAsId}."aggregateIds", ${escapeStr(
          `$."${encodeJsonPath(event.aggregateId)}"`
        )}) = 1 OR
          json_extract(${subscribersTableNameAsId}."aggregateIds", '$') IS NULL
        )`
      : `${subscribersTableNameAsId}."eventSubscriber" = 
        ${escapeStr(eventSubscriber)}
      `
  }
      ) "subscriptionIds";
        
      COMMIT;
      BEGIN IMMEDIATE;
  `)

  const subscriptionIds = (
    await runQuery(`
    SELECT "subscriptionId" FROM ${notificationsTableNameAsId}
    WHERE "insertionId" = ${escapeStr(insertionId)};
  `)
  ).map(({ subscriptionId }) => subscriptionId)

  if (mode === NOTIFICATION_UPDATE_SYMBOL) {
    return subscriptionIds
  }

  await consumer.saveEvent(event)

  return subscriptionIds
}

export default pushNotificationAndGetSubscriptions
