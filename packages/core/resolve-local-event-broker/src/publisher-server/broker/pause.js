import {
  SUBSCRIBERS_TABLE_NAME,
  SubscriptionStatus,
  DeliveryStrategy,
  ConsumerMethod
} from '../constants'

const pause = async (pool, payload) => {
  const {
    database: { runQuery, runRawQuery, escapeId, escapeStr },
    parseSubscription,
    invokeConsumer
  } = pool

  const subscribersTableNameAsId = escapeId(SUBSCRIBERS_TABLE_NAME)
  await runRawQuery(`
      UPDATE ${subscribersTableNameAsId}
      SET "status" = ${escapeStr(SubscriptionStatus.SKIP)}
      WHERE "eventSubscriber" = ${escapeStr(payload.eventSubscriber)}
      AND "status" <> ${escapeStr(SubscriptionStatus.ERROR)};

      COMMIT;
      BEGIN IMMEDIATE;
    `)

  const result = await runQuery(`
      SELECT * FROM ${subscribersTableNameAsId}
      WHERE ${subscribersTableNameAsId}."eventSubscriber" =
      ${escapeStr(payload.eventSubscriber)}
    `)

  if (result == null || result.length !== 1) {
    throw new Error(
      `Event subscriber ${payload.eventSubscriber} does not found`
    )
  }
  const { status, subscriptionId } = parseSubscription(result[0])

  if (status === SubscriptionStatus.ERROR) {
    throw new Error(
      `Event subscriber ${payload.eventSubscriber} is in error state`
    )
  }
  return subscriptionId
}

export default pause
