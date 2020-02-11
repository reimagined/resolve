const transformEvents = events => {
  let timestamp = 1
  const aggregateVersionsMap = new Map()
  const threadCountersMap = new Map()

  const result = [{ type: 'Init' }]

  for (const rawEvent of events) {
    const aggregateVersion = aggregateVersionsMap.has(rawEvent.aggregateId)
      ? aggregateVersionsMap.get(rawEvent.aggregateId) + 1
      : 1
    const threadId = Buffer.from(JSON.stringify(rawEvent)).reduce(
      (acc, val) => (acc + val) % 256,
      0
    )
    const threadCounter = threadCountersMap.has(threadId)
      ? threadCountersMap.get(threadId) + 1
      : 1

    const event = {
      ...rawEvent,
      aggregateVersion,
      timestamp: timestamp++,
      threadId,
      threadCounter
    }

    result.push(event)

    aggregateVersionsMap.set(rawEvent.aggregateId, aggregateVersion)
    threadCountersMap.set(threadId, threadCounter + 1)
  }

  return result
}

export default transformEvents
