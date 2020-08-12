import {
  SUBSCRIBERS_TABLE_NAME,
  DeliveryStrategy,
  QueueStrategy,
  SubscriptionStatus,
  ConsumerMethod
} from '../constants'

async function subscribe(pool, payload) {
  const {
    database: { escapeStr, escapeId, runQuery, runRawQuery, encodeJsonPath },
    parseSubscription,
    invokeConsumer,
    generateGuid
  } = pool

  const { eventSubscriber, subscriptionOptions } = payload
  const { deliveryStrategy, eventTypes, aggregateIds } = subscriptionOptions
  const subscribersTableNameAsId = escapeId(SUBSCRIBERS_TABLE_NAME)

  const nextSubscriptionId = generateGuid(eventSubscriber)
  if (
    deliveryStrategy !== DeliveryStrategy.ACTIVE_NONE &&
    deliveryStrategy !== DeliveryStrategy.ACTIVE_REGULAR &&
    deliveryStrategy !== DeliveryStrategy.ACTIVE_XA &&
    deliveryStrategy !== DeliveryStrategy.PASSIVE &&
    deliveryStrategy !== DeliveryStrategy.PASSTHROUGH
  ) {
    throw new Error(`Wrong deliveryStrategy="${deliveryStrategy}"`)
  }
  if (eventTypes != null && !Array.isArray(eventTypes)) {
    throw new Error(`Wrong eventTypes="${eventTypes}"`)
  }
  if (aggregateIds != null && !Array.isArray(aggregateIds)) {
    throw new Error(`Wrong aggregateIds="${aggregateIds}"`)
  }

  await runRawQuery(`
      UPDATE ${subscribersTableNameAsId} SET
      "deliveryStrategy" = ${escapeStr(deliveryStrategy)},
      "eventTypes" = ${escapeStr(
        eventTypes != null
          ? `{ ${eventTypes
              .map(
                eventType =>
                  `${JSON.stringify(encodeJsonPath(eventType))}: true`
              )
              .join(', ')} }`
          : 'null'
      )},
      "aggregateIds" = ${escapeStr(
        aggregateIds != null
          ? `{ ${aggregateIds
              .map(
                aggregateId =>
                  `${JSON.stringify(encodeJsonPath(aggregateId))}: true`
              )
              .join(', ')} }`
          : 'null'
      )},
      "queueStrategy" = ${escapeStr(QueueStrategy.NONE)},
      "maxParallel" = ${+1}
      WHERE "eventSubscriber" = ${escapeStr(eventSubscriber)};

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
        ${escapeStr(QueueStrategy.NONE)},
        ${+1},
        NULL,
        NULL,
        NULL,
        NULL
      );

      COMMIT;
      BEGIN IMMEDIATE;
  `)

  const result = await runQuery(`
    SELECT * FROM ${subscribersTableNameAsId}
    WHERE "eventSubscriber" = ${escapeStr(eventSubscriber)};
  `)

  if (result == null || result.length !== 1) {
    throw new Error('Subscription failed')
  }

  if (deliveryStrategy === DeliveryStrategy.PASSIVE) {
    await invokeConsumer(pool, ConsumerMethod.Notify, {
      eventSubscriber,
      notification: 'SUBSCRIBE',
      eventTypes: subscriptionOptions.eventTypes,
      aggregateIds: subscriptionOptions.aggregateIds
    })
  }

  const { subscriptionId } = parseSubscription(result[0])

  return subscriptionId
}

export default subscribe
