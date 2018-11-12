const sortExpression = { timestamp: 1, aggregateVersion: 1 }
const projectionExpression = { _id: 0 }

const loadEvents = async (
  { collection },
  { eventTypes, aggregateIds, startTime, finishTime },
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

  for (
    let event = await cursorStream.next();
    event != null;
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

export default loadEvents
