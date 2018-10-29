const validateEventFilter = filter => {
  if (filter == null || filter.constructor !== Object) {
    throw new Error('Event filter should be an object')
  }

  const stringArrayFields = ['eventTypes', 'aggregateIds']
  const numericFields = ['startTime', 'finishTime']
  const allowedFields = [...stringArrayFields, ...numericFields]

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

  for (const key of numericFields) {
    if (filter[key] != null && filter[key].constructor !== Number) {
      throw new Error(`Event filter field ${key} should be number`)
    }
  }
}

const wrapLoadEvents = loadEvents => async (pool, filter, callback) => {
  validateEventFilter(filter)
  if (typeof callback !== 'function') {
    throw new Error(`Callback should be function`)
  }

  await loadEvents(pool, filter, callback)
}

export default wrapLoadEvents
