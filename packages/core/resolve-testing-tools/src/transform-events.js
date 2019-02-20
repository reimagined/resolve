const transformEvents = events => {
  let timestamp = 1
  const aggregateVersionsMap = new Map()

  const result = [{ type: 'Init' }]

  for (const rawEvent of events) {
    const aggregateVersion = aggregateVersionsMap.has(rawEvent.aggregateId)
      ? aggregateVersionsMap.get(rawEvent.aggregateId) + 1
      : 1

    const event = {
      ...rawEvent,
      aggregateVersion,
      timestamp: timestamp++
    }

    result.push(event)

    aggregateVersionsMap.set(rawEvent.aggregateId, aggregateVersion)
  }

  return result
}

export default transformEvents
