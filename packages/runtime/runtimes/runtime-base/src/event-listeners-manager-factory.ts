import partial from 'lodash.partial'

import { bootstrap } from './bootstrap'
import { shutdown } from './shutdown'

import type {
  EventListenersManager,
  EventListenersManagerParameters,
  EventSubscriber,
  EventListeners,
} from './types'
import type { Adapter as EventStoreAdapter } from '@resolve-js/eventstore-base'

type EventListenersManagerRuntime = {
  eventStoreAdapter: EventStoreAdapter
  eventListeners: EventListeners
  eventSubscriber: EventSubscriber
}

export const eventListenersManagerFactory = (
  runtime: EventListenersManagerRuntime,
  params: EventListenersManagerParameters
): EventListenersManager => ({
  bootstrapAll: partial(bootstrap, runtime, params),
  shutdownAll: partial(shutdown, runtime, params),
})
