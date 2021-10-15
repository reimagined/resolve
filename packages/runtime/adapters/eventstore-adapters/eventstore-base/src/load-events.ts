import type {
  EventFilter,
  AdapterPoolConnectedProps,
  AdapterPoolConnected,
  StoredEventBatchPointer,
} from './types'
import { isTimestampFilter } from './types'

const loadEvents = async <ConnectedProps extends AdapterPoolConnectedProps>(
  pool: AdapterPoolConnected<ConnectedProps>,
  filter: EventFilter
): Promise<StoredEventBatchPointer> => {
  return isTimestampFilter(filter)
    ? await pool.loadEventsByTimestamp(filter)
    : await pool.loadEventsByCursor(filter)
}

export default loadEvents
