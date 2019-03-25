const eventCompare = (a, b) =>
  a.aggregateVersion < b.aggregateVersion
    ? -1
    : a.aggregateVersion > b.aggregateVersion
    ? 1
    : 0

const invokeByTimestampFrame = async (
  timestampFrame,
  callback,
  decodeEmptyStrings
) => {
  timestampFrame.sort(eventCompare)

  for (const { payload, ...metaEvent } of timestampFrame) {
    await callback({
      ...metaEvent,
      ...(payload !== undefined ? { payload: decodeEmptyStrings(payload) } : {})
    })
  }

  timestampFrame.length = 0
}

const executePaginationQuery = async (
  { documentClient, executeSingleQuery, decodeEmptyStrings },
  query,
  callback
) => {
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
        await invokeByTimestampFrame(
          timestampFrame,
          callback,
          decodeEmptyStrings
        )
      }
      timestampFrame.push(event)
    }
  } while (res.LastEvaluatedKey != null)

  await invokeByTimestampFrame(timestampFrame, callback, decodeEmptyStrings)
}

export default executePaginationQuery
