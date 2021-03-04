import { SavedEvent } from '@resolve-js/eventstore-base'

const shapeEvent = (event: any, additionalFields?: any): SavedEvent =>
  Object.freeze({
    threadCounter: +event.threadCounter,
    threadId: +event.threadId,
    type: event.type,
    timestamp: +event.timestamp,
    aggregateId: event.aggregateId,
    aggregateVersion: +event.aggregateVersion,
    payload: JSON.parse(event.payload),
    ...additionalFields,
  })

export default shapeEvent
