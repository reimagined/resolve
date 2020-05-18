import {
  SUBSCRIBER_OPTIONS_FETCH_SYMBOL,
  SUBSCRIBER_OPTIONS_PARSE_SYMBOL,
  TRANSFORM_JSON_REGULAR_SYMBOL,
  TRANSFORM_JSON_MAPPED_ARRAY_SYMBOL,
  TRANSFORM_NONE_SYMBOL,
  SUBSCRIBERS_TABLE_NAME
} from '../constants'

const getSubscriberOptions = async (pool, mode, content, allowedKeys) => {
  const {
    database: { runQuery, escapeStr, escapeId, decodeJsonPath }
  } = pool
  if (
    mode !== SUBSCRIBER_OPTIONS_PARSE_SYMBOL &&
    mode !== SUBSCRIBER_OPTIONS_FETCH_SYMBOL
  ) {
    throw new Error(`Invalid mode ${String(mode)}`)
  }

  let subscriptionOptions = null
  if (mode === SUBSCRIBER_OPTIONS_FETCH_SYMBOL) {
    const eventSubscriber = content
    const subscribersTableNameAsId = escapeId(SUBSCRIBERS_TABLE_NAME)
    const result = await runQuery(`
      SELECT * from ${subscribersTableNameAsId}
      WHERE "eventSubscriber" = ${escapeStr(eventSubscriber)}
    `)

    subscriptionOptions =
      result != null && result.length === 1 ? { ...result[0] } : null
  } else {
    subscriptionOptions = content
  }

  const allowedAndTransformedKeys = {
    subscriptionId: TRANSFORM_NONE_SYMBOL,
    eventSubscriber: TRANSFORM_NONE_SYMBOL,
    status: TRANSFORM_NONE_SYMBOL,
    deliveryStrategy: TRANSFORM_NONE_SYMBOL,
    eventTypes: TRANSFORM_JSON_MAPPED_ARRAY_SYMBOL,
    aggregateIds: TRANSFORM_JSON_MAPPED_ARRAY_SYMBOL,
    successEvent: TRANSFORM_JSON_REGULAR_SYMBOL,
    failedEvent: TRANSFORM_JSON_REGULAR_SYMBOL,
    errors: TRANSFORM_JSON_REGULAR_SYMBOL,
    cursor: TRANSFORM_NONE_SYMBOL
  }

  for (const key of Object.keys(subscriptionOptions)) {
    if (Array.isArray(allowedKeys) && allowedKeys.indexOf(key) < 0) {
      delete subscriptionOptions[key]
    }

    if (
      allowedAndTransformedKeys[key] === TRANSFORM_JSON_MAPPED_ARRAY_SYMBOL ||
      allowedAndTransformedKeys[key] === TRANSFORM_JSON_REGULAR_SYMBOL
    ) {
      let value = subscriptionOptions[key]
      value = value != null ? JSON.parse(value) : null
      if (
        allowedAndTransformedKeys[key] === TRANSFORM_JSON_MAPPED_ARRAY_SYMBOL
      ) {
        value = value != null ? Object.keys(value).map(decodeJsonPath) : null
      }
      subscriptionOptions[key] = value
    } else if (allowedAndTransformedKeys[key] !== TRANSFORM_NONE_SYMBOL) {
      delete subscriptionOptions[key]
    }
  }

  return subscriptionOptions
}

export default getSubscriberOptions
