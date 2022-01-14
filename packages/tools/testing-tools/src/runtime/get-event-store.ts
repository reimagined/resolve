import { Eventstore } from '@resolve-js/core'
import createEventStoreLite from '@resolve-js/eventstore-lite'
import { TestEvent } from '../types'
import { prepareEvents, stripEvents } from './events-utils'
import {
  ambiguousEventsTimeErrorMessage,
  getReservedFieldUsedErrorMessage,
  reservedEventOrderField,
} from '../constants'

export const validateEvents = (events: TestEvent[]) => {
  const stampedCount = events.filter((event) => event.timestamp != null).length
  if (stampedCount !== events.length && stampedCount > 0) {
    throw Error(ambiguousEventsTimeErrorMessage)
  }
  const invalidEventIndex = events.findIndex(
    (event) => event.payload?.[reservedEventOrderField] != null
  )
  if (invalidEventIndex >= 0) {
    throw Error(getReservedFieldUsedErrorMessage(reservedEventOrderField))
  }
}

export const getEventStore = async (
  events: TestEvent[],
  context?: { aggregateId: string }
): Promise<Eventstore> => {
  validateEvents(events)

  const preparedEvents = prepareEvents(events, context)

  const eventByAggregateIdVersion = new Map<string, TestEvent>()

  for (let eventIndex = 0; eventIndex < events.length; eventIndex++) {
    const { aggregateId, aggregateVersion } = preparedEvents[eventIndex]
    const event = events[eventIndex]
    if (event != null) {
      eventByAggregateIdVersion.set(`${aggregateId}:${aggregateVersion}`, event)
    }
  }

  const eventStoreAdapter = createEventStoreLite({
    databaseFile: ':memory:',
  })

  await eventStoreAdapter.init()

  // event ordering must be fixed anyway, so store events in parallel for proper testing
  await Promise.all(
    preparedEvents.map((event) => eventStoreAdapter.saveEvent(event))
  )

  return {
    ...eventStoreAdapter,
    loadEvents: async (
      ...args: Parameters<typeof eventStoreAdapter['loadEvents']>
    ): ReturnType<typeof eventStoreAdapter['loadEvents']> => {
      const {
        events: storedEvents,
        ...other
      } = await eventStoreAdapter.loadEvents(...args)

      const events = stripEvents(JSON.parse(JSON.stringify(storedEvents)))

      for (
        let timestampIndex = 0;
        timestampIndex < events.length;
        timestampIndex++
      ) {
        const event = events[timestampIndex]

        event.timestamp =
          eventByAggregateIdVersion.get(
            `${event.aggregateId}:${event.aggregateVersion}`
          )?.timestamp ?? timestampIndex + 1
      }

      return {
        ...other,
        events,
      }
    },
  }
}
