import debugLevels from 'resolve-debug-levels'

import shutdownOne from './shutdown-one'

const log = debugLevels('resolve:resolve-runtime:shutdown')

const shutdown = async (resolve, upstream) => {
  log.debug('shutdown started')
  const promises = []
  for (const { name: eventSubscriber } of resolve.eventListeners.values()) {
    promises.push(
      shutdownOne({
        eventBus: resolve.eventBus,
        eventSubscriber,
        upstream
      })
    )
  }

  await Promise.all(promises)

  await resolve.publisher.pause({ eventSubscriber: 'websocket' })

  await resolve.publisher.unsubscribe({ eventSubscriber: 'websocket' })

  log.debug('shutdown successful')

  return 'ok'
}

export default shutdown
