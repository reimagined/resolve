const validateEventFilter = filter => {
  if (filter == null || filter.constructor !== Object) {
    throw new Error('Event filter should be an object')
  }

  const stringArrayFields = ['eventTypes', 'aggregateIds']
  const booleanFields = ['skipStorage', 'skipBus']
  const numericFields = ['startTime', 'finishTime']
  const allowedFields = [
    ...stringArrayFields,
    ...booleanFields,
    ...numericFields
  ]

  for (const key of Object.keys(filter)) {
    if (allowedFields.indexOf(key) < 0) {
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

  for (const key of booleanFields) {
    if (filter[key] != null && filter[key].constructor !== Boolean) {
      throw new Error(`Event filter field ${key} should be boolean`)
    }
  }

  for (const key of numericFields) {
    if (filter[key] != null && filter[key].constructor !== Number) {
      throw new Error(`Event filter field ${key} should be number`)
    }
  }
}

const loadEvents = async (storage, bus, filter, handler) => {
  validateEventFilter(filter)

  if (filter.skipStorage && filter.skipBus) {
    throw new Error(
      'Cannot load events when storage and the bus are skipped at the same time'
    )
  }

  const {
    skipStorage,
    skipBus,
    startTime,
    finishTime,
    eventTypes,
    aggregateIds
  } = filter

  if (!skipStorage) {
    await storage.loadEvents(
      {
        eventTypes,
        aggregateIds,
        startTime,
        finishTime
      },
      handler
    )
  }

  if (bus == null || skipBus) {
    return null
  }

  return await bus.subscribe(
    {
      eventTypes,
      aggregateIds
    },
    handler
  )
}

const isInteger = val =>
  val != null && val.constructor === Number && parseInt(val) === val
const isString = val => val != null && val.constructor === String

const saveEvent = async (storage, bus, event) => {
  if (!isString(event.type)) {
    throw new Error('The `type` field is invalid')
  }
  if (!isString(event.aggregateId)) {
    throw new Error('The `aggregateId` field is invalid')
  }
  if (!isInteger(event.aggregateVersion)) {
    throw new Error('The `aggregateVersion` field is invalid')
  }
  if (!isInteger(event.timestamp)) {
    throw new Error('The `timestamp` field is invalid')
  }

  event.aggregateId = String(event.aggregateId)

  await storage.saveEvent(event)
  if (bus != null) {
    await bus.publish(event)
  }
  return event
}

const getLatestEvent = async (storage, bus, filter) => {
  validateEventFilter(filter)

  if (filter.skipStorage || filter.skipBus) {
    throw new Error('Cannot get last eventstore event with skip-* parameters')
  }

  void bus // Bus is not used intentionally - last event fetched from storage

  return await storage.getLatestEvent(filter)
}

const wrapMethod = (method, storage, bus, errorHandler) => async (...args) => {
  try {
    return await method(storage, bus, ...args)
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
    loadEvents: wrapMethod(loadEvents, storage, bus, errorHandler),
    getLatestEvent: wrapMethod(getLatestEvent, storage, bus, errorHandler),
    saveEvent: wrapMethod(saveEvent, storage, bus, errorHandler)
  })
}
