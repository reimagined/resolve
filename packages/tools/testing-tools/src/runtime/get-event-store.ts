import { Eventstore } from '@resolve-js/core'
import { TestEvent } from '../types'
import { prepareEvents } from './prepare-events'

export const getEventStore = (
  events: TestEvent[],
  context?: { aggregateId: string }
): Eventstore => {
  const eventStoreLocalState = new Map<
    string,
    { destination: any; status: any }
  >()

  return {
    loadEvents: async () => ({
      events: prepareEvents(events, context),
      get cursor() {
        throw new Error('Cursor access violation')
      },
    }),
    ensureEventSubscriber: async ({
      applicationName,
      eventSubscriber,
      destination,
      status,
    }: any) => {
      eventStoreLocalState.set(`${applicationName}${eventSubscriber}`, {
        ...(eventStoreLocalState.has(`${applicationName}${eventSubscriber}`)
          ? (eventStoreLocalState.get(
              `${applicationName}${eventSubscriber}`
            ) as any)
          : {}),
        ...(destination != null ? { destination } : {}),
        ...(status != null ? { status } : {}),
      })
    },
    removeEventSubscriber: async ({
      applicationName,
      eventSubscriber,
    }: any) => {
      eventStoreLocalState.delete(`${applicationName}${eventSubscriber}`)
    },
    getEventSubscribers: async ({
      applicationName,
      eventSubscriber,
    }: any = {}) => {
      if (applicationName == null && eventSubscriber == null) {
        return [...eventStoreLocalState.values()]
      }
      const result = []
      for (const [
        key,
        { destination, status },
      ] of eventStoreLocalState.entries()) {
        if (`${applicationName}${eventSubscriber}` === key) {
          result.push({
            applicationName,
            eventSubscriber,
            destination,
            status,
          })
        }
      }
      return result
    },
    getNextCursor: async () => 'SHIFT_CURSOR',
    loadSnapshot: async () => null,
    saveEvent: async () => void 0,
    saveSnapshot: () => void 0,
  }
}
