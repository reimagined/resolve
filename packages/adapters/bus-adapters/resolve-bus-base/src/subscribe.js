const validateEventFilter = filter => {
  if (filter == null || filter.constructor !== Object) {
    throw new Error('Event filter should be an object')
  }

  const stringArrayFields = ['eventTypes', 'aggregateIds']

  for (const key of Object.keys(filter)) {
    if (stringArrayFields.indexOf(key) < 0) {
      throw new Error(`Wrong field in event filter: ${key}`)
    }
  }

  for (const key of stringArrayFields) {
    if (
      filter[key] != null &&
      !(
        Array.isArray(filter[key]) &&
        filter[key].every(
          value => value != null && value.constructor === String
        )
      )
    ) {
      throw new Error(`Event filter field ${key} should be array of strings`)
    }
  }
}

const getTopicsByFilter = ({ eventTypes, aggregateIds }) => {
  const topics = []
  for (const eventType of eventTypes != null ? eventTypes : [null]) {
    for (const aggregateId of aggregateIds != null ? aggregateIds : [null]) {
      topics.push(
        `${eventType != null ? eventType : '*'}/${
          aggregateId != null ? aggregateId : '*'
        }`
      )
    }
  }
  return topics
}

const subscribeHandlerToTopics = (handlers, topics, handler) => {
  for (const topic of topics) {
    let topicHandlers = handlers.get(topic)

    if (topicHandlers == null) {
      topicHandlers = new Set()
      handlers.set(topic, topicHandlers)
    }

    topicHandlers.add(handler)
  }
}

const unsubscribeHandlerFromTopics = (handlers, topics, handler) => {
  for (const topic of topics) {
    const topicHandlers = handlers.get(topic)
    if (topicHandlers == null) {
      continue
    }

    topicHandlers.delete(handler)

    if (topicHandlers.size === 0) {
      handlers.delete(topic)
    }
  }
}

const wrapHandler = (handlers, topics, handler) => {
  const wrappedHandler = async (...args) => {
    try {
      await handler(...args)
    } catch (error) {
      unsubscribeHandlerFromTopics(handlers, topics, wrappedHandler)

      // eslint-disable-next-line no-console
      console.error(
        'Auto-unsubscribe due error in bus event handler: ',
        error,
        handler
      )
    }
  }

  return wrappedHandler
}

const subscribe = ({ handlers }, filter, handler) => {
  validateEventFilter(filter)
  const topics = getTopicsByFilter(filter)

  const wrappedHandler = wrapHandler(handlers, topics, handler)
  subscribeHandlerToTopics(handlers, topics, wrappedHandler)

  const unsubscribe = unsubscribeHandlerFromTopics.bind(
    null,
    handlers,
    topics,
    wrappedHandler
  )

  return unsubscribe
}

export default subscribe
