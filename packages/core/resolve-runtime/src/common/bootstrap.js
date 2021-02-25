import debugLevels from 'resolve-debug-levels'

import bootstrapOne from './bootstrap-one'

const log = debugLevels('resolve:resolve-runtime:bootstrap')

const bootstrap = async (resolve, upstream) => {
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
        upstream,
      })
    )
  }

  await Promise.all(promises)

  log.debug('bootstrap successful')

  return 'ok'
}

export default bootstrap
