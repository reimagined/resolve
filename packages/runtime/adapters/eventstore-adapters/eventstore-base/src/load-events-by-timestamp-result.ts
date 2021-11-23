import type { StoredEventBatchPointer, StoredEvent } from './types'

const timestampCursorMessage =
  'Cursor cannot be used when reading by timestamp boundary'

const loadEventsByTimestampResult = (
  events: StoredEvent[]
): StoredEventBatchPointer => {
  return {
    get cursor(): string {
      throw new Error(timestampCursorMessage)
    },
    events,
    toJSON: function () {
      return { events: this.events, cursor: timestampCursorMessage }
    },
  } as StoredEventBatchPointer
}

export default loadEventsByTimestampResult
