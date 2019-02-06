const sortExpression = { timestamp: -1, aggregateVersion: -1 }
const projectionExpression = { aggregateIdAndVersion: 0, _id: 0 }

const getLatestEvent = async ({ database, promiseInvoke }, filter) => {
  const { eventTypes, aggregateIds, startTime, finishTime } = filter

  const findExpression = {
    ...(eventTypes != null ? { type: { $in: eventTypes } } : {}),
    ...(aggregateIds != null ? { aggregateId: { $in: aggregateIds } } : {}),
    timestamp: {
      $gt: startTime != null ? startTime : 0,
      $lt: finishTime != null ? finishTime : Infinity
    }
  }

  const cursor = database
    .find(findExpression)
    .sort(sortExpression)
    .projection(projectionExpression)
    .skip(0)
    .limit(1)

  const events = await promiseInvoke(cursor.exec.bind(cursor))

  return events.length > 0 ? events[0] : null
}

export default getLatestEvent
