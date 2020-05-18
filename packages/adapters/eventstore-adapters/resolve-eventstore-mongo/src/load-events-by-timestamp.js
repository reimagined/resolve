import { throwBadCursor } from 'resolve-eventstore-base'

const sortExpression = { timestamp: 1, threadCounter: 1 }
const projectionExpression = { _id: 0, threadId: 0, threadCounter: 0 }

const loadEventsByTimestamp = async (
  { database, collectionName, shapeEvent },
  { eventTypes, aggregateIds, startTime, finishTime, limit }
) => {
  const findExpression = {
    ...(eventTypes != null ? { type: { $in: eventTypes } } : {}),
    ...(aggregateIds != null ? { aggregateId: { $in: aggregateIds } } : {}),
    timestamp: {
      $gt: startTime != null ? startTime : 0,
      $lt: finishTime != null ? finishTime : Infinity
    }
  }

  const collection = await database.collection(collectionName)
  const events = []

  const cursorStream = collection
    .find(findExpression)
    .sort(sortExpression)
    .project(projectionExpression)
    .stream()

  let lastError = null

  for (
    let event = await cursorStream.next(), eventsLeft = limit;
    event != null && eventsLeft-- > 0;
    event = await cursorStream.next()
  ) {
    try {
      events.push(shapeEvent(event))
    } catch (error) {
      lastError = error
      break
    }
  }

  await cursorStream.close()

  if (lastError != null) {
    throw lastError
  }

  return {
    get cursor() {
      return throwBadCursor()
    },
    events
  }
}

export default loadEventsByTimestamp
