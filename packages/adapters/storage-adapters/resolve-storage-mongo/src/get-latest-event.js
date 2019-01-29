const sortExpression = { timestamp: -1, aggregateVersion: -1 }
const projectionExpression = { _id: 0 }

const getLatestEvent = async (
  { collection },
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
