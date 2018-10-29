const applyEvent = async (pool, rawEvent) => {
  const { storage, bus } = pool

  let aggregateVersion = 1
  await storage.loadEvents({ aggregateIds: [rawEvent.aggregateId] }, () => {
    aggregateVersion++
  })

  const event = {
    ...rawEvent,
    aggregateVersion,
    timestamp: pool.timestamp++
  }

  await storage.saveEvent(event)
  await bus.publish(event)

  return event
}

export default applyEvent
