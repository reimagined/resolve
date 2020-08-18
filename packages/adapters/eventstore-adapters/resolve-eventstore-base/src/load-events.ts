import {
  AdapterState,
  AdapterImplementation,
  Cursor,
  Event,
  EventFilter,
  IAdapterOptions,
  IEventFromDatabase
} from './types'
import validateEventFilter from './validate-event-filter'

async function loadEvents<
  AdapterConnection extends any,
  AdapterOptions extends IAdapterOptions,
  EventFromDatabase extends IEventFromDatabase
>(
  state: AdapterState<AdapterConnection, AdapterOptions>,
  implementation: AdapterImplementation<
    AdapterConnection,
    AdapterOptions,
    EventFromDatabase
  >,
  filter: EventFilter
): Promise<{
  cursor: Cursor
  events: Array<Event>
}> {
  validateEventFilter(filter)
  return filter.startTime != null || filter.finishTime != null
    ? await implementation.loadEventsByTimestamp(state, filter)
    : await implementation.loadEventsByCursor(state, filter)
}

export default loadEvents
