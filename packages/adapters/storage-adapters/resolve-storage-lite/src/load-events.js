const sortExpression = { timestamp: 1, aggregateVersion: 1 }
const projectionExpression = { aggregateIdAndVersion: 0, _id: 0 }
const batchSize = 100

const loadEvents = async ({ database, promiseInvoke }, filter, callback) => {
  const { eventTypes, aggregateIds, startTime, finishTime } = filter

  const findExpression = {
    ...(eventTypes != null ? { type: { $in: eventTypes } } : {}),
    ...(aggregateIds != null ? { aggregateId: { $in: aggregateIds } } : {}),
    timestamp: {
      $gt: startTime != null ? startTime : 0,
      $lt: finishTime != null ? finishTime : Infinity
    }
  }

  for (let page = 0; true; page++) {
    const cursor = database
      .find(findExpression)
      .sort(sortExpression)
      .projection(projectionExpression)
      .skip(page * batchSize)
      .limit(batchSize + 1)

    const events = await promiseInvoke(cursor.exec.bind(cursor))

    const countEvents = Math.min(events.length, batchSize)

    for (let idx = 0; idx < countEvents; idx++) {
      await callback(events[idx])
    }

    if (events.length < batchSize + 1) {
      break
    }
  }
}

export default loadEvents
