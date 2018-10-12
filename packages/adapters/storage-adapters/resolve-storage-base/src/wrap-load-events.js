const wrapLoadEvents = (loadEvents, criteria) => async (
  pool,
  values,
  callback,
  startTime = 0
) => {
  if (criteria == null || criteria.constructor !== String) {
    throw new Error(`Wrong criteria field descriptor ${criteria}`)
  }

  if (
    !Array.isArray(values) ||
    values.some(item => item == null || item.constructor !== String)
  ) {
    throw new Error(`Field ${criteria} should be an array of strings`)
  }

  if (typeof callback !== 'function') {
    throw new Error(`Callback should be function`)
  }

  if (!Number.isInteger(startTime)) {
    throw new Error('Start time should be an integer value')
  }

  await loadEvents(pool, criteria, values, callback, startTime)
}

export default wrapLoadEvents
