const publish = async (pool, event) => {
  if (pool.disposed) {
    throw new Error('Adapter has been already disposed')
  }
  await Promise.resolve()
  try {
    const publishTopics = pool.makeTopicsForEvent(event)

    for (const topic of publishTopics) {
      const topicHandlers = pool.handlers.get(topic)
      if (topicHandlers == null) continue

      await Promise.all(
        Array.from(topicHandlers).map(handler => handler(event))
      )
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error)
  }
}

export default publish
