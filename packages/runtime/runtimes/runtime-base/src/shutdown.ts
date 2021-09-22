import debugLevels from '@resolve-js/debug-levels'

import shutdownOne from './shutdown-one'
import type { BootstrapRuntime, Runtime, EventListener } from './types'

const log = debugLevels('resolve:runtime:shutdown')

type ShutdownRuntime = {
  eventSubscriberScope: string
  eventListeners: Map<string, EventListener>
  eventStoreAdapter: Runtime['eventStoreAdapter']
  eventSubscriber: Runtime['eventSubscriber']
  upstream: BootstrapRuntime['upstream']
  deleteQueue: BootstrapRuntime['deleteQueue']
}

export const shutdown = async (runtime: ShutdownRuntime, soft: boolean) => {
  log.debug('shutdown started')
  const promises = []
  for (const { name } of runtime.eventListeners.values()) {
    promises.push(
      shutdownOne({
        ...runtime,
        name,
        soft,
      })
    )
  }

  await Promise.all(promises)

  log.debug('shutdown successful')

  return 'ok'
}
