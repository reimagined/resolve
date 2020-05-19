const loadEvents = async (pool, filter) => {
  return filter.startTime != null || filter.finishTime != null
    ? await pool.loadEventsByTimestamp(filter)
    : await pool.loadEventsByCursor(filter)
}

export default loadEvents
