const onMessage = async (pool, message) => {
  try {
    const data = message.toString().substring(pool.config.channel.length + 1)
    const event = JSON.parse(data)

    const topics = pool.makeTopicsForEvent(event)
    const applicationPromises = []

    for (const topic of topics) {
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

export default onMessage
