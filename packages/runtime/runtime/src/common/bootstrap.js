import debugLevels from '@resolve-js/debug-levels'

import bootstrapOne from './bootstrap-one'
import shutdownOne from './shutdown-one'

const log = debugLevels('resolve:runtime:bootstrap')

const bootstrap = async (resolve) => {
  log.debug('bootstrap started')
  const promises = []

  const existingEventSubscribers = (
    await resolve.eventstoreAdapter.getEventSubscribers({
      applicationName: resolve.eventSubscriberScope,
    })
  ).map(({ eventSubscriber }) => eventSubscriber)

  for (const { name, eventTypes } of resolve.eventListeners.values()) {
    promises.push(
      // eslint-disable-next-line no-loop-func
      (async () => {
        let eventSubscriberExists = existingEventSubscribers.indexOf(name) > -1
        if (eventSubscriberExists) {
          try {
            eventSubscriberExists =
              (await resolve.eventSubscriber.status({
                eventSubscriber: name,
              })) != null
          } catch (err) {}
        }
        if (!eventSubscriberExists) {
          await bootstrapOne({
            applicationName: resolve.eventSubscriberScope,
            eventstoreAdapter: resolve.eventstoreAdapter,
            eventSubscriber: resolve.eventSubscriber,
            name,
            eventTypes,
            destination: resolve.getEventSubscriberDestination(name),
            upstream: resolve.upstream,
            ensureQueue: resolve.ensureQueue,
          })
        }
      })()
    )
  }

  for (const name of existingEventSubscribers.filter(
    (name) => !resolve.eventListeners.has(name)
  )) {
    promises.push(
      shutdownOne({
        applicationName: resolve.eventSubscriberScope,
        eventstoreAdapter: resolve.eventstoreAdapter,
        eventSubscriber: resolve.eventSubscriber,
        name,
        upstream: resolve.upstream,
        deleteQueue: resolve.deleteQueue,
        soft: true,
      })
    )
  }

  await Promise.all(promises)

  log.debug('bootstrap successful')

  return 'ok'
}

export default bootstrap
