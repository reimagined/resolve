const shapeEvent = (event, additionalFields) =>
  Object.freeze({
    [Symbol.for('threadCounter')]: +event.threadCounter,
    [Symbol.for('threadId')]: +event.threadId,
    type: event.type,
    timestamp: +event.timestamp,
    aggregateId: event.aggregateId,
    aggregateVersion: +event.aggregateVersion,
    payload: JSON.parse(event.payload),
    ...additionalFields
  })

export default shapeEvent
