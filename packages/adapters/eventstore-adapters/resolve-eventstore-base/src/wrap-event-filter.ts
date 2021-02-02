import {
  AdapterPoolConnectedProps,
  AdapterPoolConnected,
  EventFilter,
  EventsWithCursor,
  isCursorFilter,
  LoadEvents,
} from './types'

const wrapEventFilter = <ConnectedProps extends AdapterPoolConnectedProps>(
  loadEvents: LoadEvents<ConnectedProps>
): LoadEvents<ConnectedProps> => async (
  pool: AdapterPoolConnected<any>,
  filter: EventFilter
): Promise<EventsWithCursor> => {
  pool.validateEventFilter(filter)
  if (isCursorFilter(filter) && filter.cursor != null) {
    try {
      if (filter.cursor !== pool.getNextCursor(filter.cursor, [])) {
        // eslint-disable-next-line no-throw-literal
        throw null
      }
    } catch (e) {
      throw new Error(
        `Event filter field "cursor" is malformed: ${JSON.stringify(
          filter.cursor
        )}` + (e == null ? '' : ` ${e}`)
      )
    }
  }

  return await loadEvents(pool, filter)
}

export default wrapEventFilter
