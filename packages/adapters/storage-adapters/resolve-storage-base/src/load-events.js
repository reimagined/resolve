const loadEvents = async (pool, filter, callback) => {
  return filter.startTime != null || filter.finishTime != null
    ? await pool.loadEventsByTimestamp(filter, callback)
    : await pool.loadEventsByCursor(filter, callback)
}

export default loadEvents
