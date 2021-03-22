import debugLevels from '@resolve-js/debug-levels'

import shutdownOne from './shutdown-one'

const log = debugLevels('resolve:runtime:shutdown')

const shutdown = async (resolve, upstream) => {
  log.debug('shutdown started')
  const promises = []
  for (const { name } of resolve.eventListeners.values()) {
    promises.push(
      shutdownOne({
        applicationName: resolve.applicationName,
        eventstoreAdapter: resolve.eventstoreAdapter,
        eventSubscriber: resolve.eventSubscriber,
        name,
        upstream,
      })
    )
  }

  await Promise.all(promises)

  log.debug('shutdown successful')

  return 'ok'
}

export default shutdown
