const wrapEventFilter = loadEvents => async (pool, filter) => {
  pool.validateEventFilter(filter)
  return await loadEvents(pool, filter)
}

export default wrapEventFilter
