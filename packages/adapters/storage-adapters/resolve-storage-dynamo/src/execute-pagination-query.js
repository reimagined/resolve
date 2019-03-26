const eventCompare = (a, b) =>
  a.aggregateVersion < b.aggregateVersion
    ? -1
    : a.aggregateVersion > b.aggregateVersion
    ? 1
    : 0

const invokeByTimestampFrame = async (pool, timestampFrame, callback) => {
  const { decodeEvent } = pool

  timestampFrame.sort(eventCompare)

  for (const event of timestampFrame) {
    await callback(decodeEvent(pool, event))
  }

  timestampFrame.length = 0
}

const executePaginationQuery = async (pool, query, callback) => {
  const { documentClient, executeSingleQuery } = pool
  let res
  const timestampFrame = []

  do {
    res = await executeSingleQuery(documentClient, query)

    query.ExclusiveStartKey = res.LastEvaluatedKey

    for (const event of res.Items) {
      if (
        timestampFrame.length !== 0 &&
        event.timestamp !== timestampFrame[0].timestamp
      ) {
        await invokeByTimestampFrame(pool, timestampFrame, callback)
      }
      timestampFrame.push(event)
    }
  } while (res.LastEvaluatedKey != null)

  await invokeByTimestampFrame(pool, timestampFrame, callback)
}

export default executePaginationQuery
