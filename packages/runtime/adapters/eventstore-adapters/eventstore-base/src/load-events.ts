import type {
  EventFilter,
  AdapterBoundPool,
  StoredEventBatchPointer,
} from './types'
import { isTimestampFilter } from './types'

const loadEvents = async <ConfiguredProps extends {}>(
  pool: AdapterBoundPool<ConfiguredProps>,
  filter: EventFilter
): Promise<StoredEventBatchPointer> => {
  return isTimestampFilter(filter)
    ? await pool.loadEventsByTimestamp(filter)
    : await pool.loadEventsByCursor(filter)
}

export default loadEvents
