const onMessage = async (pool, message) => {
  try {
    const data = message.toString().substring(pool.config.channel.length + 1)
    const event = JSON.parse(data)

    const topics = pool.makeTopicsForEvent(event)

    for (const topic of topics) {
      const topicHandlers = pool.handlers.get(topic)
      if (topicHandlers == null) return

      await Promise.all(
        Array.from(topicHandlers).map(handler => handler(event))
      )
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error)
  }
}

export default onMessage
