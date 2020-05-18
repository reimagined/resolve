import {
  DELIVERY_STRATEGY_ACTIVE_NONE,
  DELIVERY_STRATEGY_ACTIVE_REGULAR,
  DELIVERY_STRATEGY_ACTIVE_XA,
  DELIVERY_STRATEGY_PASSIVE,
  STATUS_SKIP,
  QUEUE_STRATEGY_NONE,
  NOTIFICATIONS_TABLE_NAME,
  SUBSCRIBERS_TABLE_NAME,
  BATCHES_TABLE_NAME,
  SUBSCRIBE_SYMBOL,
  RESUBSCRIBE_SYMBOL,
  UNSUBSCRIBE_SYMBOL
} from '../constants'

const ensureOrResetSubscription = async (
  pool,
  mode,
  eventSubscriber,
  subscriptionOptions
) => {
  const {
    database: { runQuery, runRawQuery, escapeId, escapeStr, encodeJsonPath }
  } = pool
  const notificationsTableNameAsId = escapeId(NOTIFICATIONS_TABLE_NAME)
  const subscribersTableNameAsId = escapeId(SUBSCRIBERS_TABLE_NAME)
  const batchesTableNameAsId = escapeId(BATCHES_TABLE_NAME)

  if (
    mode !== SUBSCRIBE_SYMBOL &&
    mode !== RESUBSCRIBE_SYMBOL &&
    mode !== UNSUBSCRIBE_SYMBOL
  ) {
    throw new Error(`Wrong mode="${String(mode)}"`)
  }

  const prevSubscriptionIdResult = await runQuery(`
    SELECT "subscriptionId" from ${subscribersTableNameAsId}
    WHERE "eventSubscriber" = ${escapeStr(eventSubscriber)}
  `)
  const prevSubscriptionId =
    Array.isArray(prevSubscriptionIdResult) &&
    prevSubscriptionIdResult.length > 0
      ? prevSubscriptionIdResult[0].subscriptionId
      : null

  const unsubscribeSql = `
    DELETE FROM ${batchesTableNameAsId}
    WHERE "batchId" IN (
      SELECT "batchId" from ${notificationsTableNameAsId}
      WHERE "eventSubscriber" = ${escapeStr(eventSubscriber)}
    );

    DELETE FROM ${notificationsTableNameAsId}
    WHERE "eventSubscriber" = ${escapeStr(eventSubscriber)};

    DELETE FROM ${subscribersTableNameAsId}
    WHERE "eventSubscriber" = ${escapeStr(eventSubscriber)};
  `

  if (mode === UNSUBSCRIBE_SYMBOL) {
    return prevSubscriptionId != null
      ? void (await runRawQuery(`
          ${unsubscribeSql}
          COMMIT;
          BEGIN IMMEDIATE;
        `))
      : null
  }

  const { deliveryStrategy, eventTypes, aggregateIds } = subscriptionOptions
  const nextSubscriptionId = `${eventSubscriber}${Date.now()}${Math.random()}`
  if (
    deliveryStrategy !== DELIVERY_STRATEGY_ACTIVE_NONE &&
    deliveryStrategy !== DELIVERY_STRATEGY_ACTIVE_REGULAR &&
    deliveryStrategy !== DELIVERY_STRATEGY_ACTIVE_XA &&
    deliveryStrategy !== DELIVERY_STRATEGY_PASSIVE
  ) {
    throw new Error(`Wrong deliveryStrategy="${deliveryStrategy}"`)
  }

  if (eventTypes != null && !Array.isArray(eventTypes)) {
    throw new Error(`Wrong eventTypes="${eventTypes}"`)
  }

  if (aggregateIds != null && !Array.isArray(aggregateIds)) {
    throw new Error(`Wrong aggregateIds="${aggregateIds}"`)
  }

  const subscribeSql = `
    INSERT OR REPLACE INTO ${subscribersTableNameAsId}(
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
      COALESCE(
        (
          SELECT "subscriptionId" from ${subscribersTableNameAsId}
          WHERE "eventSubscriber" = ${escapeStr(eventSubscriber)}
        ),
        ${escapeStr(nextSubscriptionId)}
      ),
      ${escapeStr(eventSubscriber)},
      COALESCE(
        (
          SELECT "status" from ${subscribersTableNameAsId}
          WHERE "eventSubscriber" = ${escapeStr(eventSubscriber)}
        ),
        ${escapeStr(STATUS_SKIP)}
      ),
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
      ${escapeStr(QUEUE_STRATEGY_NONE)},
      ${+1},
      (
        SELECT "successEvent" from ${subscribersTableNameAsId}
        WHERE "eventSubscriber" = ${escapeStr(eventSubscriber)}
      ),
      (
        SELECT "failedEvent" from ${subscribersTableNameAsId}
        WHERE "eventSubscriber" = ${escapeStr(eventSubscriber)}
      ),
      (
        SELECT "errors" from ${subscribersTableNameAsId}
        WHERE "eventSubscriber" = ${escapeStr(eventSubscriber)}
      ),
      (
        SELECT "cursor" from ${subscribersTableNameAsId}
        WHERE "eventSubscriber" = ${escapeStr(eventSubscriber)}
      )
    );
  `
  await runRawQuery(`
    ${mode === RESUBSCRIBE_SYMBOL ? unsubscribeSql : ''}
    ${subscribeSql}
    COMMIT;
    BEGIN IMMEDIATE;
  `)

  const subscriptionId =
    mode === SUBSCRIBE_SYMBOL
      ? prevSubscriptionId != null
        ? prevSubscriptionId
        : nextSubscriptionId
      : nextSubscriptionId

  return subscriptionId
}

export default ensureOrResetSubscription
