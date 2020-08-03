import { EventFilter } from './types'

async function loadEvents(pool: any, filter: EventFilter) {
  return filter.startTime != null || filter.finishTime != null
    ? await pool.loadEventsByTimestamp(filter)
    : await pool.loadEventsByCursor(filter)
}

export default loadEvents
