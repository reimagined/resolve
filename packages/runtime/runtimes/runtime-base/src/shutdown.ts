import debugLevels from '@resolve-js/debug-levels'

import { shutdownOne } from './shutdown-one'
import type {
  EventListeners,
  EventListenersManagerParameters,
  EventSubscriber,
} from './types'
import type { Adapter as EventStoreAdapter } from '@resolve-js/eventstore-base'

const log = debugLevels('resolve:runtime:shutdown')

type ShutdownRuntime = {
  eventStoreAdapter: EventStoreAdapter
  eventListeners: EventListeners
  eventSubscriber: EventSubscriber
}

export const shutdown = async (
  runtime: ShutdownRuntime,
  params: EventListenersManagerParameters,
  soft: boolean
) => {
  const promises = []
  log.debug(
    `enqueue shutdown of ${runtime.eventListeners.size} event listeners`
  )
  for (const { name } of runtime.eventListeners.values()) {
    promises.push(
      shutdownOne({
        ...runtime,
        ...params,
        name,
        soft,
      })
    )
  }

  log.debug(`awaiting tasks to complete`)
  await Promise.all(promises)

  log.debug('shutdown successful')
}
