import {
  ConsumerMethod,
  SubscriptionStatus,
  SUBSCRIBERS_TABLE_NAME
} from '../constants'

const reset = async (pool, payload) => {
  const {
    database: { runQuery, runRawQuery, escapeStr, escapeId, encodeJsonPath },
    parseSubscription,
    invokeConsumer,
    generateGuid
  } = pool
  const { eventSubscriber } = payload
  const subscribersTableNameAsId = escapeId(SUBSCRIBERS_TABLE_NAME)
  const nextSubscriptionId = generateGuid(eventSubscriber)
  const result = await runQuery(`
    SELECT ${subscribersTableNameAsId}."subscriptionId" AS "subscriptionId",
    ${subscribersTableNameAsId}."deliveryStrategy" AS "deliveryStrategy",
    ${subscribersTableNameAsId}."queueStrategy" AS "queueStrategy",
    ${subscribersTableNameAsId}."eventTypes" AS "eventTypes",
    ${subscribersTableNameAsId}."aggregateIds" AS "aggregateIds"
    FROM ${subscribersTableNameAsId}
    WHERE "eventSubscriber" = ${escapeStr(eventSubscriber)}
  `)
  if (result == null || result.length !== 1) {
    throw new Error(`Event subscriber ${eventSubscriber} does not found`)
  }
  const {
    subscriptionId,
    deliveryStrategy,
    queueStrategy,
    eventTypes,
    aggregateIds
  } = parseSubscription(result[0])

  await runRawQuery(`
    DELETE FROM ${subscribersTableNameAsId}
    WHERE "subscriptionId" = ${escapeStr(subscriptionId)};

    INSERT OR IGNORE INTO ${subscribersTableNameAsId}(
      "subscriptionId",
      "eventSubscriber",
      "status",
      "deliveryStrategy",
      "eventTypes",
      "aggregateIds",
      "queueStrategy",
      "maxParallel",
      "successEvent",
      "failedEvent",
      "errors",
      "cursor"
    ) VALUES (
      ${escapeStr(nextSubscriptionId)},
      ${escapeStr(eventSubscriber)},
      ${escapeStr(SubscriptionStatus.SKIP)},
      ${escapeStr(deliveryStrategy)},
      ${escapeStr(
        eventTypes != null
          ? `{ ${eventTypes
              .map(
                eventType =>
                  `${JSON.stringify(encodeJsonPath(eventType))}: true`
              )
              .join(', ')} }`
          : 'null'
      )},
      ${escapeStr(
        aggregateIds != null
          ? `{ ${aggregateIds
              .map(
                aggregateId =>
                  `${JSON.stringify(encodeJsonPath(aggregateId))}: true`
              )
              .join(', ')} }`
          : 'null'
      )},
      ${escapeStr(queueStrategy)},
      ${+1},
      NULL,
      NULL,
      NULL,
      NULL
    );
  
    COMMIT;
    BEGIN IMMEDIATE;
  `)

  await invokeConsumer(pool, ConsumerMethod.Drop, { eventSubscriber })

  return subscriptionId
}

export default reset
