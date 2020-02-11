const sortExpression = { timestamp: -1 }
const projectionExpression = { _id: 0, threadId: 0, threadCounter: 0 }

const getLatestEvent = async (
  { database, collectionName },
  { eventTypes, aggregateIds, startTime, finishTime }
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

  const events = await collection
    .find(findExpression)
    .sort(sortExpression)
    .project(projectionExpression)
    .skip(0)
    .limit(1)
    .toArray()

  return events.length > 0 ? events[0] : null
}

export default getLatestEvent
