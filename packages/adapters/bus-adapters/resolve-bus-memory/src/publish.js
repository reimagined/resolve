const publish = async (pool, event) => {
  if (pool.disposed) {
    throw new Error('Adapter has been already disposed')
  }
  await Promise.resolve()
  try {
    const publishTopics = pool.makeTopicsForEvent(event)
    const applicationPromises = []

    for (const topic of publishTopics) {
      const topicHandlers = pool.handlers.get(topic)
      if (topicHandlers == null) continue

      for (const handler of Array.from(topicHandlers)) {
        applicationPromises.push(handler(event))
      }
    }

    await Promise.all(applicationPromises)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error)
  }
}

export default publish
