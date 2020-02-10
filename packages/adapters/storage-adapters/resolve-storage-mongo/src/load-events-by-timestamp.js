const sortExpression = { timestamp: 1, threadCounter: 1 }
const projectionExpression = { _id: 0, threadId: 0, threadCounter: 0 }

const loadEventsByTimestamp = async (
  { database, collectionName },
  { eventTypes, aggregateIds, startTime, finishTime, limit },
  callback
) => {
  const batchSize = limit != null ? limit : 0x7fffffff
  const findExpression = {
    ...(eventTypes != null ? { type: { $in: eventTypes } } : {}),
    ...(aggregateIds != null ? { aggregateId: { $in: aggregateIds } } : {}),
    timestamp: {
      $gt: startTime != null ? startTime : 0,
      $lt: finishTime != null ? finishTime : Infinity
    }
  }

  const collection = await database.collection(collectionName)

  const cursorStream = collection
    .find(findExpression)
    .sort(sortExpression)
    .project(projectionExpression)
    .stream()

  let lastError = null

  for (
    let event = await cursorStream.next(), eventsLeft = batchSize;
    event != null && eventsLeft-- > 0;
    event = await cursorStream.next()
  ) {
    try {
      await callback(event)
    } catch (error) {
      lastError = error
      break
    }
  }

  await cursorStream.close()

  if (lastError != null) {
    throw lastError
  }
}

export default loadEventsByTimestamp
