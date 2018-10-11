const busEventFilter = async (criteria, values, handler, event) => {
  if (event == null || !event.hasOwnProperty(criteria)) return
  if (values.indexOf(event[criteria]) < 0) return
  await handler(event)
}

const subscribeByEventType = async (
  storage,
  bus,
  eventTypes,
  handler,
  { onlyBus = false, startTime = 0 } = {}
) => {
  if (!onlyBus) {
    await storage.loadEventsByTypes(eventTypes, handler, startTime)
  }

  return bus.subscribe(busEventFilter.bind(null, 'type', eventTypes, handler))
}

const subscribeByAggregateId = async (
  storage,
  bus,
  aggregateId,
  handler,
  { onlyBus = false, startTime = 0 } = {}
) => {
  const aggregateIds = Array.isArray(aggregateId) ? aggregateId : [aggregateId]
  if (!onlyBus) {
    await storage.loadEventsByAggregateIds(aggregateIds, handler, startTime)
  }

  return bus.subscribe(
    busEventFilter.bind(null, 'aggregateId', aggregateIds, handler)
  )
}

const subscribeOnBus = async (storage, bus, handler) => {
  return await bus.subscribe(handler)
}

const getEventsByAggregateId = async (
  storage,
  bus,
  aggregateId,
  handler,
  startTime = 0
) => {
  const aggregateIds = Array.isArray(aggregateId) ? aggregateId : [aggregateId]
  return await storage.loadEventsByAggregateIds(
    aggregateIds,
    handler,
    startTime
  )
}

const saveEvent = async (storage, bus, event) => {
  if (!event.type) {
    throw new Error('The `type` field is missed')
  }
  if (!event.aggregateId) {
    throw new Error('The `aggregateId` field is missed')
  }
  event.timestamp = Date.now()
  event.aggregateId = String(event.aggregateId)

  await storage.saveEvent(event)
  await bus.publish(event)
  return event
}

const wrapMethod = (method, storage, bus, errorHandler) => async (...args) => {
  try {
    await method(storage, bus, ...args)
  } catch (error) {
    await errorHandler(error)
  }
}

export default (
  { storage, bus },
  errorHandler = err => {
    throw err
  }
) => {
  return Object.freeze({
    subscribeByEventType: wrapMethod(
      subscribeByEventType,
      storage,
      bus,
      errorHandler
    ),
    subscribeByAggregateId: wrapMethod(
      subscribeByAggregateId,
      storage,
      bus,
      errorHandler
    ),
    subscribeOnBus: wrapMethod(subscribeOnBus, storage, bus, errorHandler),
    getEventsByAggregateId: wrapMethod(
      getEventsByAggregateId,
      storage,
      bus,
      errorHandler
    ),
    saveEvent: wrapMethod(saveEvent, storage, bus, errorHandler)
  })
}
