import type {
  AdapterPoolConnectedProps,
  AdapterPoolConnected,
  EventFilter,
  EventsWithCursor,
  PoolMethod,
  Adapter,
} from './types'

import { isCursorFilter } from './types'

const wrapEventFilter = <ConnectedProps extends AdapterPoolConnectedProps>(
  loadEvents: PoolMethod<ConnectedProps, Adapter['loadEvents']>
): PoolMethod<ConnectedProps, Adapter['loadEvents']> => async (
  pool: AdapterPoolConnected<ConnectedProps>,
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
