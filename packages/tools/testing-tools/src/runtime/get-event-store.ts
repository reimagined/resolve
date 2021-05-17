import { Eventstore } from '@resolve-js/core'
import createEventStoreLite from '@resolve-js/eventstore-lite'
import { TestEvent } from '../types'
import { prepareEvents } from './prepare-events'

export const getEventStore = async (
  events: TestEvent[],
  context?: { aggregateId: string }
): Promise<Eventstore> => {
  const preparedEvents = prepareEvents(events, context)

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

        let event: TestEvent | null = null

        for (let eventIndex = 0; eventIndex < events.length; eventIndex++) {
          if (
            preparedEvents[eventIndex].aggregateId ===
              eventFromEventStore.aggregateId &&
            preparedEvents[eventIndex].aggregateVersion ===
              eventFromEventStore.aggregateVersion
          ) {
            event = events[eventIndex]
          }
        }

        if (event != null) {
          eventFromEventStore.timestamp = event.timestamp ?? timestampIndex
        }
      }

      return {
        ...other,
        events: eventsFromEventStore,
      }
    },
  }
}
