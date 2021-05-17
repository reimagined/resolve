import { Eventstore } from '@resolve-js/core'
import createEventStoreLite from '@resolve-js/eventstore-lite'
import { TestEvent } from '../types'
import { prepareEvents } from './prepare-events'

export const validateEvents = (events: TestEvent[]) => {
  let withSpecifiedTimestamp = false
  let withoutSpecifiedTimestamp = false
  for (const event of events) {
    if (event.timestamp != null) {
      if (withoutSpecifiedTimestamp) {
        /* TODO @EugeniyBurmistrov */
        throw new Error('Invalid events')
      }
      withSpecifiedTimestamp = true
    } else if (withSpecifiedTimestamp) {
      /* TODO @EugeniyBurmistrov */
      throw new Error('Invalid events')
    } else {
      withoutSpecifiedTimestamp = true
    }
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
