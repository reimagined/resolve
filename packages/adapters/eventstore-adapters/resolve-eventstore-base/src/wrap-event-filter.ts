import { EventFilter } from './types'

function wrapEventFilter(loadEvents: Function) {
  return async function (pool: any, filter: EventFilter) {
    pool.validateEventFilter(filter)
    return await loadEvents(pool, filter)
  }
}

export default wrapEventFilter
