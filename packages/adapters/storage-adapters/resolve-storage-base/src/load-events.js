const loadEvents = async (pool, filter, callback) => {
  return filter.startTime != null || filter.finishTime != null
    ? await pool.loadEventsByTimestamp(pool, filter, callback)
    : await pool.loadEventsByCursor(pool, filter, callback)
}

export default loadEvents
