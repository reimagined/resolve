const wrapEventFilter = loadEvents => async (pool, filter, callback) => {
  pool.validateEventFilter(filter)
  if (typeof callback !== 'function') {
    throw new Error(`Callback should be function`)
  }

  await loadEvents(pool, filter, callback)
}

export default wrapEventFilter
