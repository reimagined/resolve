const hasType = (type, obj) => obj != null && obj.constructor === type

const validateEventFilter = filter => {
  if (!hasType(Object, filter)) {
    throw new Error('Event filter should be an object')
  }

  const errors = []
  const stringArrayFields = ['eventTypes', 'aggregateIds']
  const numericFields = ['startTime', 'finishTime', 'limit']
  const conflictFields = [
    ['startTime', 'cursor'],
    ['finishTime', 'cursor']
  ]

  for (const key of Object.keys(filter)) {
    if (
      !stringArrayFields.includes(key) &&
      !numericFields.includes(key) &&
      key !== 'cursor'
    ) {
      errors.push(`Wrong field "${key}" in event filter`)
    } else if (numericFields.includes(key) && !hasType(Number, filter[key])) {
      errors.push(`Event filter field "${key}" should be number`)
    } else if (
      stringArrayFields.includes(key) &&
      !(
        (Array.isArray(filter[key]) &&
          filter[key].every(hasType.bind(null, String))) ||
        filter[key] == null
      )
    ) {
      errors.push(
        `Event filter field "${key}" should be array of strings or be null`
      )
    } else if (
      key === 'cursor' &&
      !(hasType(String, filter[key]) || filter[key] == null)
    ) {
      errors.push(`Event filter field "${key}" should be string or null`)
    }
  }

  for (const [key1, key2] of conflictFields) {
    if (filter[key1] != null && filter[key2] != null) {
      errors.push(`Event filter field "${key1}" conflicts with field "${key2}"`)
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.join('\n'))
  }
}

export default validateEventFilter
