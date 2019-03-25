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
  const deprecatedFields = ['skipStorage', 'skipBus']

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

  for (const key of deprecatedFields) {
    if (filter.hasOwnProperty(key)) {
      // TODO: how to notify about deprecated fields?
      // console.log(`'${key}' filter parameter is deprecated`)
    }
  }
}

const loadEvents = async (storage, filter, handler) => {
  validateEventFilter(filter)

  const { startTime, finishTime, eventTypes, aggregateIds } = filter

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

const isInteger = val =>
  val != null && val.constructor === Number && parseInt(val) === val
const isString = val => val != null && val.constructor === String

const saveEvent = async (storage, publishEvent, event) => {
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
  if (typeof publishEvent === 'function') {
    await publishEvent(event)
  }
  return event
}

const getLatestEvent = async (storage, filter) => {
  validateEventFilter(filter)

  return await storage.getLatestEvent(filter)
}

const wrapMethod = (errorHandler, method, ...partialArgs) => async (
  ...args
) => {
  try {
    return await method(...partialArgs.concat(args))
  } catch (error) {
    await errorHandler(error)
  }
}

export default (
  { storage, publishEvent },
  errorHandler = err => {
    throw err
  }
) => {
  return Object.freeze({
    loadEvents: wrapMethod(errorHandler, loadEvents, storage),
    getLatestEvent: wrapMethod(errorHandler, getLatestEvent, storage),
    saveEvent: wrapMethod(errorHandler, saveEvent, storage, publishEvent)
  })
}
