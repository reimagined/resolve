import {
  NotificationStatus,
  SubscriptionStatus,
  NOTIFICATIONS_TABLE_NAME,
  SUBSCRIBERS_TABLE_NAME,
  LONG_INTEGER_SQL_TYPE,
  LazinessStrategy,
  PrivateOperationType,
  DeliveryStrategy,
} from '../constants'

const resumeSubscriber = async (pool, payload) => {
  const {
    database: { escapeId, escapeStr, runQuery, runRawQuery },
    invokeOperation,
    generateGuid,
  } = pool

  const { eventSubscriber, conditionalResume } = payload
  const notificationsTableNameAsId = escapeId(NOTIFICATIONS_TABLE_NAME)
  const subscribersTableNameAsId = escapeId(SUBSCRIBERS_TABLE_NAME)

  const insertionId = generateGuid('FORCEUPDATE')

  await runRawQuery(`
      UPDATE ${subscribersTableNameAsId}
      SET "status" = ${escapeStr(SubscriptionStatus.DELIVER)}
      WHERE "eventSubscriber" = ${escapeStr(eventSubscriber)}
      AND ${
        conditionalResume
          ? `"status" = ${escapeStr(SubscriptionStatus.DELIVER)}`
          : `"status" <> ${escapeStr(SubscriptionStatus.ERROR)}`
      };

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
        ${escapeStr('FORCEUPDATE')} AS "aggregateIdAndVersion",
        ${escapeStr(NotificationStatus.RECIEVED)} AS "status"
      FROM (
        SELECT ${subscribersTableNameAsId}."subscriptionId"
        FROM ${subscribersTableNameAsId}
        WHERE "eventSubscriber" = ${escapeStr(eventSubscriber)}
        AND "status" = ${escapeStr(SubscriptionStatus.DELIVER)}
        AND "deliveryStrategy" <> ${escapeStr(DeliveryStrategy.PASSTHROUGH)}
      ) "subscriptionIds";

      COMMIT;
      BEGIN IMMEDIATE;
    `)

  const result = await runQuery(`
      SELECT ${subscribersTableNameAsId}."subscriptionId",
      ${subscribersTableNameAsId}."status"
      FROM ${subscribersTableNameAsId}
      WHERE "eventSubscriber" = ${escapeStr(eventSubscriber)}
      AND (
        "status" = ${escapeStr(SubscriptionStatus.DELIVER)} OR
        "status" = ${escapeStr(SubscriptionStatus.SKIP)}
      )
  `)
  if (result == null || result.length !== 1) {
    throw new Error(
      `Notification for event subscriber ${eventSubscriber} cannot be pushed`
    )
  }
  const { subscriptionId, status } = result[0]

  if (status === SubscriptionStatus.DELIVER) {
    const input = {
      type: PrivateOperationType.PULL_NOTIFICATIONS,
      payload: {
        subscriptionId,
      },
    }

    await invokeOperation(pool, LazinessStrategy.EAGER, input)
  }
}

export default resumeSubscriber
