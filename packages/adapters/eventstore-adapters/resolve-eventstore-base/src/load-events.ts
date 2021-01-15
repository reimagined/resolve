const loadEvents = async (pool: any, filter: any): Promise<any> => {
  return filter.startTime != null || filter.finishTime != null
    ? await pool.loadEventsByTimestamp(filter)
    : await pool.loadEventsByCursor(filter)
}

export default loadEvents
