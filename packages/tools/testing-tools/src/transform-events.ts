const transformEvents = (
  events: any[],
  target: 'read-model' | 'aggregate' = 'read-model',
  context?: {
    aggregateId: string
  }
): any => {
  let timestamp = 1
  const aggregateVersionsMap = new Map()
  const threadCountersMap = new Map()

  const result = []

  for (const rawEvent of events) {
    const aggregateId =
      target === 'aggregate' ? context?.aggregateId : rawEvent.aggregateId

    const aggregateVersion = aggregateVersionsMap.has(aggregateId)
      ? aggregateVersionsMap.get(aggregateId) + 1
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
      aggregateId,
      aggregateVersion,
      timestamp: timestamp++,
      threadId,
      threadCounter,
    }

    result.push(event)

    aggregateVersionsMap.set(aggregateId, aggregateVersion)
    threadCountersMap.set(threadId, threadCounter + 1)
  }

  return result
}

export default transformEvents
