const onMessage = async (pool, message) => {
  try {
    if (
      !message ||
      !message.content ||
      typeof message.content.toString !== 'function'
    ) {
      return
    }

    const content = message.content.toString()
    const event = JSON.parse(content)

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
