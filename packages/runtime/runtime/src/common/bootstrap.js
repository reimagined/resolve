import debugLevels from '@resolve-js/debug-levels'

import bootstrapOne from './bootstrap-one'

const log = debugLevels('resolve:runtime:bootstrap')

const bootstrap = async (resolve) => {
  log.debug('bootstrap started')
  const promises = []
  for (const { name, eventTypes } of resolve.eventListeners.values()) {
    promises.push(
      bootstrapOne({
        applicationName: resolve.applicationName,
        eventstoreAdapter: resolve.eventstoreAdapter,
        eventSubscriber: resolve.eventSubscriber,
        name,
        eventTypes,
        destination: resolve.eventSubscriberDestination,
        upstream: resolve.upstream,
        ensureQueue: resolve.ensureQueue,
      })
    )
  }

  await Promise.all(promises)

  log.debug('bootstrap successful')

  return 'ok'
}

export default bootstrap
