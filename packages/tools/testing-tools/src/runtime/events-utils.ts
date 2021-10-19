import omit from 'lodash.omit'
import { reservedEventOrderField } from '../constants'
import type { Event, StoredEvent } from '@resolve-js/core'
import type { TestEvent } from '../types'

export const prepareEvents = (
  events: TestEvent[],
  context?: {
    aggregateId: string
  }
): Event[] => {
  let timestamp = Date.now() + 60 * 1000
  let order = 0
  const aggregateVersionsMap = new Map()

  return events.map(
    (testEvent: TestEvent): Event => {
      const aggregateId =
        testEvent.aggregateId != null
          ? testEvent.aggregateId
          : context?.aggregateId

      const aggregateVersion = aggregateVersionsMap.has(aggregateId)
        ? aggregateVersionsMap.get(aggregateId) + 1
        : 1

      const event: any = {
        ...testEvent,
        aggregateId,
        aggregateVersion,
        timestamp: timestamp++,
        payload: {
          ...testEvent.payload,
          [reservedEventOrderField]: order++,
        },
      }

      aggregateVersionsMap.set(aggregateId, aggregateVersion)

      return event
    }
  )
}

export const stripEvents = (events: StoredEvent[]): StoredEvent[] =>
  events
    .sort(
      (a, b) =>
        a.payload[reservedEventOrderField] - b.payload[reservedEventOrderField]
    )
    .map((event) => ({
      ...event,
      payload: { ...omit(event.payload, reservedEventOrderField) },
    }))
