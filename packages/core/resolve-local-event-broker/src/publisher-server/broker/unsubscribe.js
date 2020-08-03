import {
  SUBSCRIBERS_TABLE_NAME,
  DeliveryStrategy,
  ConsumerMethod
} from '../constants'

async function unsubscribe(pool, payload) {
  const {
    database: { escapeStr, escapeId, runQuery, runRawQuery },
    invokeConsumer,
    parseSubscription
  } = pool

  const { eventSubscriber } = payload
  const subscribersTableNameAsId = escapeId(SUBSCRIBERS_TABLE_NAME)

  const result = await runQuery(`
    SELECT "deliveryStrategy" FROM ${subscribersTableNameAsId}
    WHERE "eventSubscriber" = ${escapeStr(eventSubscriber)};
  `)

  if (result != null || result.length === 1) {
    const { deliveryStrategy } = parseSubscription(result[0])
    if (deliveryStrategy === DeliveryStrategy.PASSIVE) {
      await invokeConsumer(pool, ConsumerMethod.Notify, {
        eventSubscriber,
        notification: 'UNSUBSCRIBE'
      })
    }
  }

  await runRawQuery(`
    DELETE FROM ${subscribersTableNameAsId}
    WHERE "eventSubscriber" = ${escapeStr(eventSubscriber)};

    COMMIT;
    BEGIN IMMEDIATE;
  `)
}

export default unsubscribe
