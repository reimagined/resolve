const shapeEvent = (event, additionalFields) =>
  Object.freeze({
    threadCounter: +event.threadCounter,
    threadId: +event.threadId,
    type: event.type,
    timestamp: +event.timestamp,
    aggregateId: event.aggregateId,
    aggregateVersion: +event.aggregateVersion,
    payload: event.payload,
    ...additionalFields,
  })

export default shapeEvent
