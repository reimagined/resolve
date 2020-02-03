import loadEventsByCursor from './load-events-by-cursor'
import loadEventsByTimestamp from './load-events-by-timestamp'

const loadEvents = async (pool, filter, callback) => {
  return filter.startTime != null || filter.finishTime != null
    ? await loadEventsByTimestamp(pool, filter, callback)
    : await loadEventsByCursor(pool, filter, callback)
}

export default loadEvents
