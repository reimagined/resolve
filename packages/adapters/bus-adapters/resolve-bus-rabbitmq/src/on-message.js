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
    const applicationPromises = []

    for (const topic of topics) {
      const topicHandlers = pool.handlers.get(topic)
      if (topicHandlers == null) return

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
