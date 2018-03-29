export default (
  config,
  errorHandler = err => {
    throw err
  }
) => {
  const projectionMap = { types: new Map(), ids: new Map() }

  function trigger(event) {
    const handlersByType = projectionMap.types.get(event.type) || []
    const handlersById = projectionMap.ids.get(event.aggregateId) || []
    handlersByType.concat(handlersById).forEach(handler => handler(event))
  }

  config.bus.subscribe(trigger)

  const onEvent = (eventMap, eventDescriptors, callback) => {
    eventDescriptors.forEach(eventDescriptor => {
      const handlers = eventMap.get(eventDescriptor) || []
      handlers.push(callback)
      eventMap.set(eventDescriptor, handlers)
    })

    return () => {
      eventDescriptors.forEach(eventDescriptor => {
        const handlers = eventMap
          .get(eventDescriptor)
          .filter(item => item !== callback)

        eventMap.set(eventDescriptor, handlers)
      })
    }
  }

  const onEventByType = onEvent.bind(null, projectionMap.types)
  const onEventById = onEvent.bind(null, projectionMap.ids)

  const result = {
    async subscribeByEventType(
      eventTypes,
      handler,
      { onlyBus = false, startTime = 0 } = {}
    ) {
      if (!onlyBus) {
        await config.storage.loadEventsByTypes(eventTypes, handler, startTime)
      }
      return onEventByType(eventTypes, handler)
    },

    async subscribeByAggregateId(
      aggregateId,
      handler,
      { onlyBus = false, startTime = 0 } = {}
    ) {
      const aggregateIds = Array.isArray(aggregateId)
        ? aggregateId
        : [aggregateId]
      if (!onlyBus) {
        await config.storage.loadEventsByAggregateIds(
          aggregateIds,
          handler,
          startTime
        )
      }
      return onEventById(aggregateIds, handler)
    },

    async getEventsByAggregateId(aggregateId, handler, startTime = 0) {
      const aggregateIds = Array.isArray(aggregateId)
        ? aggregateId
        : [aggregateId]
      return await config.storage.loadEventsByAggregateIds(
        aggregateIds,
        handler,
        startTime
      )
    },

    async saveEvent(event) {
      if (!event.type) {
        throw new Error('The `type` field is missed')
      }
      if (!event.aggregateId) {
        throw new Error('The `aggregateId` field is missed')
      }
      event.timestamp = Date.now()
      event.aggregateId = String(event.aggregateId)

      await config.storage.saveEvent(event)
      await config.bus.publish(event)
      return event
    },

    async saveEventRaw(event) {
      const { type, aggregateId, timestamp } = event
      if (!type) {
        throw new Error('The `type` field is missed')
      }
      if (!aggregateId) {
        throw new Error('The `aggregateId` field is missed')
      }
      if (parseInt(timestamp, 10) !== timestamp) {
        throw new Error('The `timestamp` field is missed or incorrect')
      }
      event.aggregateId = String(event.aggregateId)

      await config.storage.saveEvent(event)
      await config.bus.publish(event)
      return event
    }
  }

  return Object.keys(result).reduce((acc, methodName) => {
    acc[methodName] = async (...args) => {
      try {
        return await result[methodName](...args)
      } catch (err) {
        errorHandler(err)
      }
    }

    return acc
  }, {})
}
