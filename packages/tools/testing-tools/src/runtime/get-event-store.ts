import { Eventstore } from '@resolve-js/core'
import createEventStoreLite from '@resolve-js/eventstore-lite'
import { TestEvent } from '../types'
import { prepareEvents } from './prepare-events'
import { ambiguousEventsTimeErrorMessage } from '../constants'

export const validateEvents = (events: TestEvent[]) => {
  const stampedCount = events.filter((event) => event.timestamp != null).length
  if (stampedCount !== events.length && stampedCount > 0) {
    throw Error(ambiguousEventsTimeErrorMessage)
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

  const eventStoreAdapter: any = createEventStoreLite({
    databaseFile: ':memory:',
  })

  await eventStoreAdapter.init()
  for (const event of preparedEvents) {
    await eventStoreAdapter.saveEvent(event)
  }

  return {
    ...eventStoreAdapter,
    loadEvents: async (...args: any) => {
      const {
        events: originalEvents,
        ...other
      } = await eventStoreAdapter.loadEvents(...args)

      const eventsFromEventStore = JSON.parse(JSON.stringify(originalEvents))

      for (
        let timestampIndex = 0;
        timestampIndex < eventsFromEventStore.length;
        timestampIndex++
      ) {
        const eventFromEventStore = eventsFromEventStore[timestampIndex]

        eventFromEventStore.timestamp =
          eventByAggregateIdVersion.get(
            `${eventFromEventStore.aggregateId}:${eventFromEventStore.aggregateVersion}`
          )?.timestamp ?? timestampIndex
      }

      return {
        ...other,
        events: eventsFromEventStore,
      }
    },
  }
}
