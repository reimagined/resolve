import type {
  AdapterBoundPool,
  EventFilter,
  StoredEventBatchPointer,
  PoolMethod,
  Adapter,
} from './types'

import { isCursorFilter } from './types'

const wrapEventFilter = <ConfiguredProps extends {}>(
  loadEvents: PoolMethod<ConfiguredProps, Adapter['loadEvents']>
): PoolMethod<ConfiguredProps, Adapter['loadEvents']> => async (
  pool: AdapterBoundPool<ConfiguredProps>,
  filter: EventFilter
): Promise<StoredEventBatchPointer> => {
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
