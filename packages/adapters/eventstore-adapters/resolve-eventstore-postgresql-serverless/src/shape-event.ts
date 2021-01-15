const shapeEvent = (event: any, additionalFields: any): any[] =>
  Object.freeze({
    threadCounter: +event.threadCounter,
    threadId: +event.threadId,
    type: event.type,
    timestamp: event.timestamp,
    aggregateId: event.aggregateId,
    aggregateVersion: event.aggregateVersion,
    payload: JSON.parse(event.payload),
    ...additionalFields,
  })

export default shapeEvent
