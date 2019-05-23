const sortExpression = { timestamp: 1, aggregateVersion: 1 }
const projectionExpression = { _id: 0 }

const loadEvents = async (
  { collection },
  {
    eventTypes,
    aggregateIds,
    startTime,
    finishTime,
    maxEventsByTimeframe = Number.POSITIVE_INFINITY
  },
  callback
) => {
  const findExpression = {
    ...(eventTypes != null ? { type: { $in: eventTypes } } : {}),
    ...(aggregateIds != null ? { aggregateId: { $in: aggregateIds } } : {}),
    timestamp: {
      $gt: startTime != null ? startTime : 0,
      $lt: finishTime != null ? finishTime : Infinity
    }
  }

  const cursorStream = collection
    .find(findExpression)
    .sort(sortExpression)
    .project(projectionExpression)
    .stream()

  let lastError = null

  let initialTimestamp = null
  let countEvents = 0
  for (
    let event = await cursorStream.next();
    event != null;
    event = await cursorStream.next()
  ) {
    try {
      if (initialTimestamp == null) {
        initialTimestamp = event.timestamp
      }

      if (
        countEvents++ > maxEventsByTimeframe &&
        event.timestamp !== initialTimestamp
      ) {
        break
      }

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

export default loadEvents
