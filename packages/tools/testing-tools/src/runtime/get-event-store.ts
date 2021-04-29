import { Eventstore } from '@resolve-js/core'
import createEventStoreLite from '@resolve-js/eventstore-lite'
import { TestEvent } from '../types'
import { prepareEvents } from './prepare-events'

export const getEventStore = async (
  events: TestEvent[],
  context?: { aggregateId: string }
): Promise<Eventstore> => {
  const eventStoreAdapter: any = createEventStoreLite({
    databaseFile: ':memory:',
  })

  await eventStoreAdapter.init()
  for (const event of prepareEvents(events, context)) {
    await eventStoreAdapter.saveEvent(event)
  }

  return eventStoreAdapter
}
