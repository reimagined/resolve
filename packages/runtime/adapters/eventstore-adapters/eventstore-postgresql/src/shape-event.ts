import { StoredEvent } from '@resolve-js/eventstore-base'

const shapeEvent = (event: any, additionalFields: any): StoredEvent =>
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
