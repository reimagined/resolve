const applyEvents = async (pool, events) => {
  const { storage, bus } = pool

  const aggregateIdsSet = new Set()
  const aggregateVersionsMap = new Map()

  for (const { aggregateId } of events) {
    aggregateIdsSet.add(aggregateId)
    aggregateVersionsMap.set(aggregateId, 1)
  }

  const aggregateIds = Array.from(aggregateIdsSet)

  await storage.loadEvents({ aggregateIds }, event => {
    aggregateVersionsMap.set(
      event.aggregateId,
      aggregateVersionsMap.get(event.aggregateId) + 1
    )
  })

  const result = []

  for (const rawEvent of events) {
    const event = {
      ...rawEvent,
      aggregateVersion: aggregateVersionsMap.get(rawEvent.aggregateId),
      timestamp: pool.timestamp++
    }

    aggregateVersionsMap.set(
      event.aggregateId,
      aggregateVersionsMap.get(event.aggregateId) + 1
    )

    await storage.saveEvent(event)
    await bus.publish(event)
    result.push(event)
  }

  return result
}

export default applyEvents
