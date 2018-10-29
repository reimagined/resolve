const sortExpression = { timestamp: 1, aggregateVersion: 1 }
const projectionExpression = { aggregateIdAndVersion: 0, _id: 0 }
const batchSize = 100

const loadEvents = async (pool, filter, callback) => {
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
    const cursor = pool.db
      .find(findExpression)
      .sort(sortExpression)
      .projection(projectionExpression)
      .skip(page * batchSize)
      .limit(batchSize + 1)

    const events = await pool.promiseInvoke(cursor.exec.bind(cursor))

    for (const event of events) {
      await callback(event)
    }

    if (events.length < batchSize) {
      break
    }
  }
}

export default loadEvents
