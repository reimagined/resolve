import {
  TRANSFORM_JSON_MAPPED_ARRAY_SYMBOL,
  TRANSFORM_JSON_REGULAR_SYMBOL,
  TRANSFORM_NONE_SYMBOL,
} from '../constants'

function parseSubscription(subscriptionDescription, allowedKeys) {
  const subscriptionOptions = { ...subscriptionDescription }
  const allowedAndTransformedKeys = {
    subscriptionId: TRANSFORM_NONE_SYMBOL,
    eventSubscriber: TRANSFORM_NONE_SYMBOL,
    status: TRANSFORM_NONE_SYMBOL,
    deliveryStrategy: TRANSFORM_NONE_SYMBOL,
    queueStrategy: TRANSFORM_NONE_SYMBOL,
    eventTypes: TRANSFORM_JSON_MAPPED_ARRAY_SYMBOL,
    aggregateIds: TRANSFORM_JSON_MAPPED_ARRAY_SYMBOL,
    successEvent: TRANSFORM_JSON_REGULAR_SYMBOL,
    failedEvent: TRANSFORM_JSON_REGULAR_SYMBOL,
    errors: TRANSFORM_JSON_REGULAR_SYMBOL,
    cursor: TRANSFORM_JSON_REGULAR_SYMBOL,
    xaTransactionId: TRANSFORM_JSON_REGULAR_SYMBOL,
    runStatus: TRANSFORM_NONE_SYMBOL,
    batchId: TRANSFORM_NONE_SYMBOL,
    isEventBasedRun: TRANSFORM_NONE_SYMBOL,
    hasErrors: TRANSFORM_NONE_SYMBOL,
    maxParallel: TRANSFORM_NONE_SYMBOL,
    scopeName: TRANSFORM_NONE_SYMBOL,
    properties: TRANSFORM_JSON_REGULAR_SYMBOL,
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
        value =
          value != null
            ? Object.keys(value).map((jsonPath) =>
                jsonPath
                  .replace(/\u001aSLASH/g, '\\')
                  .replace(/\u001aDOT/g, '.')
                  .replace(/\u001aQUOTE/g, '"')
                  .replace(/\u001aSUB/g, '\u001a')
              )
            : null
      }
      subscriptionOptions[key] = value
    } else if (allowedAndTransformedKeys[key] !== TRANSFORM_NONE_SYMBOL) {
      delete subscriptionOptions[key]
    }
  }
  return subscriptionOptions
}

export default parseSubscription
